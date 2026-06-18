import type { Database } from '~/infra/database/drizzle'
import type {
  PreferenceSelector,
  UpdatePreferenceInput,
  UserPreference
} from '~/modules/v1/preferences/domain/preferences.types'

import { and, eq } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { defaultPreferencesTable } from '~/infra/database/drizzle/schema/default-preferences.table'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'
import { userPreferencesTable } from '~/infra/database/drizzle/schema/user-preferences.table'
import { DatabasePort } from '~/infra/database/ports/database.port'

import { PreferencesRepositoryPort } from '~/modules/v1/preferences/ports/preferences.repo.port'

@Injectable()
export class PreferencesDrizzleRepository extends PreferencesRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly database: DatabasePort<Database>
  ) {
    super()
  }

  async initialize(userId: string): Promise<UserPreference[]> {
    const defaults = await this.database.client
      .select({
        notificationTypeId: defaultPreferencesTable.notificationTypeId,
        channelCode: channelsTable.code,
        enabled: defaultPreferencesTable.enabled
      })
      .from(defaultPreferencesTable)
      .innerJoin(
        channelsTable,
        eq(defaultPreferencesTable.channelId, channelsTable.id)
      )
      .innerJoin(
        notificationTypesTable,
        eq(
          defaultPreferencesTable.notificationTypeId,
          notificationTypesTable.id
        )
      )
      .where(
        and(
          eq(notificationTypesTable.isActive, true),
          eq(channelsTable.isActive, true)
        )
      )

    if (defaults.length === 0) {
      return []
    }

    await this.database.client
      .insert(userPreferencesTable)
      .values(
        defaults.map((preference) => ({
          userId,
          notificationTypeId: preference.notificationTypeId,
          channel: preference.channelCode,
          enabled: preference.enabled
        }))
      )
      .onConflictDoNothing({
        target: [
          userPreferencesTable.userId,
          userPreferencesTable.notificationTypeId,
          userPreferencesTable.channel
        ]
      })

    return this.findAllByUserId(userId)
  }

  findAllByUserId(userId: string): Promise<UserPreference[]> {
    return this.database.client
      .select({
        id: userPreferencesTable.id,
        userId: userPreferencesTable.userId,
        notificationTypeCode: notificationTypesTable.code,
        notificationTypeName: notificationTypesTable.name,
        isTransactional: notificationTypesTable.isTransactional,
        channelCode: userPreferencesTable.channel,
        enabled: userPreferencesTable.enabled,
        createdAt: userPreferencesTable.createdAt,
        updatedAt: userPreferencesTable.updatedAt
      })
      .from(userPreferencesTable)
      .innerJoin(
        notificationTypesTable,
        eq(
          userPreferencesTable.notificationTypeId,
          notificationTypesTable.id
        )
      )
      .where(eq(userPreferencesTable.userId, userId))
      .orderBy(notificationTypesTable.code, userPreferencesTable.channel)
  }

  async update(
    userId: string,
    input: UpdatePreferenceInput
  ): Promise<UserPreference | null> {
    const [notificationType] = await this.database.client
      .select({
        id: notificationTypesTable.id,
        code: notificationTypesTable.code,
        name: notificationTypesTable.name,
        isTransactional: notificationTypesTable.isTransactional
      })
      .from(notificationTypesTable)
      .where(
        and(
          eq(notificationTypesTable.code, input.notificationType),
          eq(notificationTypesTable.isActive, true)
        )
      )
      .limit(1)

    const [channel] = await this.database.client
      .select({ code: channelsTable.code })
      .from(channelsTable)
      .where(
        and(
          eq(channelsTable.code, input.channel),
          eq(channelsTable.isActive, true)
        )
      )
      .limit(1)

    if (!notificationType || !channel) {
      return null
    }

    const [record] = await this.database.client
      .insert(userPreferencesTable)
      .values({
        userId,
        notificationTypeId: notificationType.id,
        channel: channel.code,
        enabled: input.enabled
      })
      .onConflictDoUpdate({
        target: [
          userPreferencesTable.userId,
          userPreferencesTable.notificationTypeId,
          userPreferencesTable.channel
        ],
        set: { enabled: input.enabled, updatedAt: new Date() }
      })
      .returning()

    if (!record) {
      throw new Error('Failed to update preference')
    }

    return {
      id: record.id,
      userId: record.userId,
      notificationTypeCode: notificationType.code,
      notificationTypeName: notificationType.name,
      isTransactional: notificationType.isTransactional,
      channelCode: record.channel,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  async resetToDefault(
    userId: string,
    selector: PreferenceSelector
  ): Promise<UserPreference | null> {
    const [defaultPreference] = await this.database.client
      .select({
        notificationTypeId: notificationTypesTable.id,
        notificationTypeCode: notificationTypesTable.code,
        notificationTypeName: notificationTypesTable.name,
        isTransactional: notificationTypesTable.isTransactional,
        channelCode: channelsTable.code,
        enabled: defaultPreferencesTable.enabled
      })
      .from(defaultPreferencesTable)
      .innerJoin(
        notificationTypesTable,
        eq(
          defaultPreferencesTable.notificationTypeId,
          notificationTypesTable.id
        )
      )
      .innerJoin(
        channelsTable,
        eq(defaultPreferencesTable.channelId, channelsTable.id)
      )
      .where(
        and(
          eq(notificationTypesTable.code, selector.notificationType),
          eq(channelsTable.code, selector.channel)
        )
      )
      .limit(1)

    if (!defaultPreference) {
      return null
    }

    const [record] = await this.database.client
      .insert(userPreferencesTable)
      .values({
        userId,
        notificationTypeId: defaultPreference.notificationTypeId,
        channel: defaultPreference.channelCode,
        enabled: defaultPreference.enabled
      })
      .onConflictDoUpdate({
        target: [
          userPreferencesTable.userId,
          userPreferencesTable.notificationTypeId,
          userPreferencesTable.channel
        ],
        set: { enabled: defaultPreference.enabled, updatedAt: new Date() }
      })
      .returning()

    if (!record) {
      throw new Error('Failed to reset preference to default')
    }

    return {
      id: record.id,
      userId: record.userId,
      notificationTypeCode: defaultPreference.notificationTypeCode,
      notificationTypeName: defaultPreference.notificationTypeName,
      isTransactional: defaultPreference.isTransactional,
      channelCode: record.channel,
      enabled: record.enabled,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }
}
