import type { Database } from '~/infra/database/drizzle'
import type {
  CompleteIdempotencyRecordInput,
  CreateIdempotencyRecordInput,
  IdempotencyRecord,
  IdempotencyScope
} from '~/modules/v1/idempotency/domain/idempotency.types'

import { and, eq, lte } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di'
import { idempotencyRecordsTable } from '~/infra/database/drizzle/schema/idempotency-records.table'
import { DatabasePort } from '~/infra/database/ports/database.port'
import { IdempotencyRepositoryPort } from '~/modules/v1/idempotency/ports/idempotency.repo.port'

@Injectable()
export class IdempotencyDrizzleRepository extends IdempotencyRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly database: DatabasePort<Database>
  ) {
    super()
  }

  async findByScope(
    scope: IdempotencyScope
  ): Promise<IdempotencyRecord | null> {
    const [record] = await this.database.client
      .select()
      .from(idempotencyRecordsTable)
      .where(
        and(
          eq(idempotencyRecordsTable.userId, scope.userId),
          eq(idempotencyRecordsTable.operation, scope.operation),
          eq(idempotencyRecordsTable.idempotencyKey, scope.idempotencyKey)
        )
      )
      .limit(1)

    return record ? this.mapRecord(record) : null
  }

  async createProcessing(
    input: CreateIdempotencyRecordInput
  ): Promise<IdempotencyRecord | null> {
    const [record] = await this.database.client
      .insert(idempotencyRecordsTable)
      .values({
        userId: input.userId,
        operation: input.operation,
        idempotencyKey: input.idempotencyKey,
        requestHash: input.requestHash,
        status: 'processing',
        expiresAt: input.expiresAt
      })
      .onConflictDoNothing({
        target: [
          idempotencyRecordsTable.userId,
          idempotencyRecordsTable.operation,
          idempotencyRecordsTable.idempotencyKey
        ]
      })
      .returning()

    return record ? this.mapRecord(record) : null
  }

  async complete(input: CompleteIdempotencyRecordInput): Promise<void> {
    await this.database.client
      .update(idempotencyRecordsTable)
      .set({
        status: 'completed',
        responseStatus: input.responseStatus,
        responseBody: input.responseBody,
        updatedAt: new Date()
      })
      .where(eq(idempotencyRecordsTable.id, input.id))
  }

  async deleteExpiredByScope(
    scope: IdempotencyScope,
    now: Date
  ): Promise<void> {
    await this.database.client
      .delete(idempotencyRecordsTable)
      .where(
        and(
          eq(idempotencyRecordsTable.userId, scope.userId),
          eq(idempotencyRecordsTable.operation, scope.operation),
          eq(idempotencyRecordsTable.idempotencyKey, scope.idempotencyKey),
          lte(idempotencyRecordsTable.expiresAt, now)
        )
      )
  }

  async deleteById(id: string): Promise<void> {
    await this.database.client
      .delete(idempotencyRecordsTable)
      .where(eq(idempotencyRecordsTable.id, id))
  }

  private mapRecord(
    record: typeof idempotencyRecordsTable.$inferSelect
  ): IdempotencyRecord {
    return {
      id: record.id,
      userId: record.userId,
      operation: record.operation,
      idempotencyKey: record.idempotencyKey,
      requestHash: record.requestHash,
      status: record.status,
      responseStatus: record.responseStatus,
      responseBody: record.responseBody,
      expiresAt: record.expiresAt,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    }
  }
}
