import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi
} from 'vitest'

import type { TestApplication } from '../setup/test-application'
import type { PostgresTestContext } from '../setup/postgres-test-container'

import {
  resetPostgresTestDatabase,
  startPostgresTestContainer,
  stopPostgresTestContainer
} from '../setup/postgres-test-container'
import { createTestApplication } from '../setup/test-application'

interface ReferenceIds {
  notificationTypes: {
    transactional: string
    marketing: string
  }
  channels: {
    email: string
    sms: string
    push: string
  }
}

describe('Notification Preferences Service integration scenarios', () => {
  let context: PostgresTestContext
  let application: TestApplication
  let references: ReferenceIds

  beforeAll(async () => {
    context = await startPostgresTestContainer()
    application = createTestApplication(context)
  })

  beforeEach(async () => {
    await resetPostgresTestDatabase(context)
    references = await loadReferenceIds(context)
  })

  afterAll(async () => {
    if (context) {
      await stopPostgresTestContainer(context)
    }
  })

  it('initializes a new user with the configured default preferences', async () => {
    const preferences =
      await application.preferencesService.initialize('user-defaults')

    expect(preferences).toHaveLength(6)
    expect(
      findPreference(preferences, 'transactional', 'email').enabled
    ).toBe(true)
    expect(findPreference(preferences, 'marketing', 'email').enabled).toBe(
      false
    )
  })

  it('updates one user preference without changing the remaining defaults', async () => {
    const userId = 'user-preference-update'

    await application.preferencesService.initialize(userId)
    await application.preferencesService.update(userId, {
      notificationTypeId: references.notificationTypes.marketing,
      channelId: references.channels.email,
      enabled: true
    })

    const preferences =
      await application.preferencesService.getByUserId(userId)

    expect(findPreference(preferences, 'marketing', 'email').enabled).toBe(
      true
    )
    expect(
      findPreference(preferences, 'transactional', 'email').enabled
    ).toBe(true)
  })

  it('blocks non-transactional notifications during quiet hours but allows transactional notifications', async () => {
    const userId = 'user-quiet-hours'

    await application.preferencesService.initialize(userId)
    await application.preferencesService.update(userId, {
      notificationTypeId: references.notificationTypes.marketing,
      channelId: references.channels.push,
      enabled: true
    })
    await application.quietHoursService.update(userId, {
      startTime: '22:00:00',
      endTime: '08:00:00',
      timezone: 'Europe/Tbilisi'
    })

    const datetime = new Date('2026-05-21T19:30:00.000Z')
    const marketingResult = await application.evaluationService.evaluate({
      userId,
      notificationTypeId: references.notificationTypes.marketing,
      channelId: references.channels.push,
      region: 'GE',
      datetime
    })
    const transactionalResult =
      await application.evaluationService.evaluate({
        userId,
        notificationTypeId: references.notificationTypes.transactional,
        channelId: references.channels.push,
        region: 'GE',
        datetime
      })

    expect(marketingResult).toEqual({
      decision: 'deny',
      reasons: ['blocked_by_quiet_hours']
    })
    expect(transactionalResult).toEqual({
      decision: 'allow',
      reasons: ['allowed']
    })
  })

  it('applies a matching regional global policy before user preferences', async () => {
    const userId = 'user-global-policy'

    await application.preferencesService.initialize(userId)
    await application.preferencesService.update(userId, {
      notificationTypeId: references.notificationTypes.marketing,
      channelId: references.channels.sms,
      enabled: true
    })

    const result = await application.evaluationService.evaluate({
      userId,
      notificationTypeId: references.notificationTypes.marketing,
      channelId: references.channels.sms,
      region: 'EU',
      datetime: new Date('2026-05-21T12:00:00.000Z')
    })

    expect(result).toEqual({
      decision: 'deny',
      reasons: ['marketing_sms_blocked_in_eu']
    })
  })

  it('replays a repeated preference command without executing it twice', async () => {
    const userId = 'user-idempotency'
    const handler = vi.fn(async () => {
      const preference = await application.preferencesService.update(
        userId,
        {
          notificationTypeId: references.notificationTypes.transactional,
          channelId: references.channels.email,
          enabled: false
        }
      )

      return {
        statusCode: 200,
        body: { enabled: preference.enabled }
      }
    })
    const command = {
      userId,
      operation: 'preferences.update',
      idempotencyKey: 'disable-transactional-email',
      payload: {
        notificationTypeId: references.notificationTypes.transactional,
        channelId: references.channels.email,
        enabled: false
      }
    }

    await application.preferencesService.initialize(userId)

    const firstResult = await application.idempotencyService.execute(
      command,
      handler
    )
    const replayedResult = await application.idempotencyService.execute(
      command,
      handler
    )
    const preferences =
      await application.preferencesService.getByUserId(userId)

    expect(firstResult).toEqual({
      statusCode: 200,
      body: { enabled: false },
      replayed: false
    })
    expect(replayedResult).toEqual({
      statusCode: 200,
      body: { enabled: false },
      replayed: true
    })
    expect(handler).toHaveBeenCalledTimes(1)
    expect(
      findPreference(preferences, 'transactional', 'email').enabled
    ).toBe(false)

    const recordCount = await context.pool.query<{ count: string }>(
      'SELECT count(*)::text AS count FROM idempotency_records'
    )

    expect(recordCount.rows[0]?.count).toBe('1')
  })
})

async function loadReferenceIds(
  context: PostgresTestContext
): Promise<ReferenceIds> {
  const notificationTypes = await context.pool.query<{
    id: string
    code: string
  }>('SELECT id, code FROM notification_types')
  const channels = await context.pool.query<{
    id: string
    code: string
  }>('SELECT id, code FROM channels')

  return {
    notificationTypes: {
      transactional: findReferenceId(
        notificationTypes.rows,
        'transactional'
      ),
      marketing: findReferenceId(notificationTypes.rows, 'marketing')
    },
    channels: {
      email: findReferenceId(channels.rows, 'email'),
      sms: findReferenceId(channels.rows, 'sms'),
      push: findReferenceId(channels.rows, 'push')
    }
  }
}

function findReferenceId(
  records: Array<{ id: string; code: string }>,
  code: string
): string {
  const record = records.find((item) => item.code === code)

  if (!record) {
    throw new Error(`Reference record was not found: ${code}`)
  }

  return record.id
}

function findPreference(
  preferences: Awaited<
    ReturnType<TestApplication['preferencesService']['getByUserId']>
  >,
  notificationTypeCode: string,
  channelCode: string
) {
  const preference = preferences.find(
    (item) =>
      item.notificationTypeCode === notificationTypeCode &&
      item.channelCode === channelCode
  )

  if (!preference) {
    throw new Error(
      `Preference was not found: ${notificationTypeCode}/${channelCode}`
    )
  }

  return preference
}
