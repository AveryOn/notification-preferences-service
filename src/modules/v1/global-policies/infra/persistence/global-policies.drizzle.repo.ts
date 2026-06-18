import { and, eq, isNull, or } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di/di.container'
import type { Database } from '~/infra/database/drizzle'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { globalPoliciesTable } from '~/infra/database/drizzle/schema/global-policies.table'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'
import { DatabasePort } from '~/infra/database/ports/database.port'
import type {
  CreateGlobalPolicyInput,
  GlobalPolicy,
  GlobalPolicyDecision,
  MatchGlobalPoliciesInput
} from '~/modules/v1/global-policies/domain/global-policies.types'
import { GlobalPoliciesRepositoryPort } from '~/modules/v1/global-policies/ports/global-policies.repo.port'

@Injectable()
export class GlobalPoliciesDrizzleRepository extends GlobalPoliciesRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly database: DatabasePort<Database>
  ) {
    super()
  }

  async create(
    input: CreateGlobalPolicyInput
  ): Promise<GlobalPolicy | null> {
    const notificationTypeId = await this.resolveNotificationTypeId(
      input.notificationType ?? null
    )

    if (input.notificationType && !notificationTypeId) {
      return null
    }

    const channelId = await this.resolveChannelId(input.channel ?? null)

    if (input.channel && !channelId) {
      return null
    }

    const [record] = await this.database.client
      .insert(globalPoliciesTable)
      .values({
        notificationTypeId,
        channelId,
        region: input.region ?? null,
        decision: input.decision,
        reason: input.reason
      })
      .onConflictDoUpdate({
        target: [
          globalPoliciesTable.notificationTypeId,
          globalPoliciesTable.channelId,
          globalPoliciesTable.region,
          globalPoliciesTable.decision,
          globalPoliciesTable.reason
        ],
        set: { updatedAt: new Date() }
      })
      .returning()

    if (!record) {
      throw new Error('Failed to create global policy')
    }

    return {
      id: record.id,
      notificationType: input.notificationType ?? null,
      channel: input.channel ?? null,
      region: record.region,
      decision: record.decision as GlobalPolicyDecision,
      reason: record.reason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  async findAll(): Promise<GlobalPolicy[]> {
    const records = await this.database.client
      .select({
        id: globalPoliciesTable.id,
        notificationType: notificationTypesTable.code,
        channel: channelsTable.code,
        region: globalPoliciesTable.region,
        decision: globalPoliciesTable.decision,
        reason: globalPoliciesTable.reason,
        createdAt: globalPoliciesTable.createdAt,
        updatedAt: globalPoliciesTable.updatedAt
      })
      .from(globalPoliciesTable)
      .leftJoin(
        notificationTypesTable,
        eq(
          globalPoliciesTable.notificationTypeId,
          notificationTypesTable.id
        )
      )
      .leftJoin(
        channelsTable,
        eq(globalPoliciesTable.channelId, channelsTable.id)
      )
      .orderBy(globalPoliciesTable.createdAt)

    return records.map((record) => ({
      ...record,
      decision: record.decision as GlobalPolicyDecision
    }))
  }

  async findMatching(
    input: MatchGlobalPoliciesInput
  ): Promise<GlobalPolicy[]> {
    const records = await this.database.client
      .select({
        id: globalPoliciesTable.id,
        notificationType: notificationTypesTable.code,
        channel: channelsTable.code,
        region: globalPoliciesTable.region,
        decision: globalPoliciesTable.decision,
        reason: globalPoliciesTable.reason,
        createdAt: globalPoliciesTable.createdAt,
        updatedAt: globalPoliciesTable.updatedAt
      })
      .from(globalPoliciesTable)
      .leftJoin(
        notificationTypesTable,
        eq(
          globalPoliciesTable.notificationTypeId,
          notificationTypesTable.id
        )
      )
      .leftJoin(
        channelsTable,
        eq(globalPoliciesTable.channelId, channelsTable.id)
      )
      .where(
        and(
          or(
            isNull(globalPoliciesTable.notificationTypeId),
            eq(notificationTypesTable.code, input.notificationType)
          ),
          or(
            isNull(globalPoliciesTable.channelId),
            eq(channelsTable.code, input.channel)
          ),
          or(
            isNull(globalPoliciesTable.region),
            eq(globalPoliciesTable.region, input.region)
          )
        )
      )
      .orderBy(globalPoliciesTable.createdAt)

    return records.map((record) => ({
      ...record,
      decision: record.decision as GlobalPolicyDecision
    }))
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.database.client
      .delete(globalPoliciesTable)
      .where(eq(globalPoliciesTable.id, id))
      .returning({ id: globalPoliciesTable.id })

    return deleted.length > 0
  }

  private async resolveNotificationTypeId(
    code: string | null
  ): Promise<string | null> {
    if (!code) return null

    const [record] = await this.database.client
      .select({ id: notificationTypesTable.id })
      .from(notificationTypesTable)
      .where(
        and(
          eq(notificationTypesTable.code, code),
          eq(notificationTypesTable.isActive, true)
        )
      )
      .limit(1)

    return record?.id ?? null
  }

  private async resolveChannelId(
    code: string | null
  ): Promise<string | null> {
    if (!code) return null

    const [record] = await this.database.client
      .select({ id: channelsTable.id })
      .from(channelsTable)
      .where(
        and(eq(channelsTable.code, code), eq(channelsTable.isActive, true))
      )
      .limit(1)

    return record?.id ?? null
  }
}
