import type { Database } from '~/infra/database/drizzle'
import type {
  CreateGlobalPolicyInput,
  GlobalPolicy,
  MatchGlobalPoliciesInput
} from '~/modules/v1/global-policies/domain/global-policies.types'

import { and, eq, isNull, or } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di/di.container'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { globalPoliciesTable } from '~/infra/database/drizzle/schema/global-policies.table'
import { notificationTypesTable } from '~/infra/database/drizzle/schema/notification-types.table'
import { DatabasePort } from '~/infra/database/ports/database.port'
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
    const notificationTypeId = input.notificationTypeId ?? null
    const channelId = input.channelId ?? null

    if (
      notificationTypeId &&
      !(await this.isNotificationTypeActive(notificationTypeId))
    ) {
      return null
    }

    if (channelId && !(await this.isChannelActive(channelId))) {
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
          globalPoliciesTable.region
        ],
        set: {
          decision: input.decision,
          reason: input.reason,
          updatedAt: new Date()
        }
      })
      .returning()

    if (!record) {
      throw new Error('Failed to create global policy')
    }

    return {
      id: record.id,
      notificationTypeId: record.notificationTypeId,
      channelId: record.channelId,
      region: record.region,
      decision: record.decision,
      reason: record.reason,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }

  findAll(): Promise<GlobalPolicy[]> {
    return this.database.client
      .select({
        id: globalPoliciesTable.id,
        notificationTypeId: globalPoliciesTable.notificationTypeId,
        channelId: globalPoliciesTable.channelId,
        region: globalPoliciesTable.region,
        decision: globalPoliciesTable.decision,
        reason: globalPoliciesTable.reason,
        createdAt: globalPoliciesTable.createdAt,
        updatedAt: globalPoliciesTable.updatedAt
      })
      .from(globalPoliciesTable)
      .orderBy(globalPoliciesTable.createdAt)
  }

  findMatching(input: MatchGlobalPoliciesInput): Promise<GlobalPolicy[]> {
    return this.database.client
      .select({
        id: globalPoliciesTable.id,
        notificationTypeId: globalPoliciesTable.notificationTypeId,
        channelId: globalPoliciesTable.channelId,
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
            and(
              eq(
                globalPoliciesTable.notificationTypeId,
                input.notificationTypeId
              ),
              eq(notificationTypesTable.isActive, true)
            )
          ),
          or(
            isNull(globalPoliciesTable.channelId),
            and(
              eq(globalPoliciesTable.channelId, input.channelId),
              eq(channelsTable.isActive, true)
            )
          ),
          or(
            isNull(globalPoliciesTable.region),
            eq(globalPoliciesTable.region, input.region)
          )
        )
      )
      .orderBy(globalPoliciesTable.createdAt)
  }

  async deleteById(id: string): Promise<boolean> {
    const deleted = await this.database.client
      .delete(globalPoliciesTable)
      .where(eq(globalPoliciesTable.id, id))
      .returning({ id: globalPoliciesTable.id })

    return deleted.length > 0
  }

  private async isNotificationTypeActive(id: string): Promise<boolean> {
    const [record] = await this.database.client
      .select({ id: notificationTypesTable.id })
      .from(notificationTypesTable)
      .where(
        and(
          eq(notificationTypesTable.id, id),
          eq(notificationTypesTable.isActive, true)
        )
      )
      .limit(1)

    return record !== undefined
  }

  private async isChannelActive(id: string): Promise<boolean> {
    const [record] = await this.database.client
      .select({ id: channelsTable.id })
      .from(channelsTable)
      .where(
        and(eq(channelsTable.id, id), eq(channelsTable.isActive, true))
      )
      .limit(1)

    return record !== undefined
  }
}
