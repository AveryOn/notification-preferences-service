import type { Database } from '~/infra/database/drizzle'
import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput
} from '~/modules/v1/channels/domain/channels.types'

import { eq } from 'drizzle-orm'
import { Inject, Injectable } from '~/core/di'
import { channelsTable } from '~/infra/database/drizzle/schema/channels.table'
import { DatabasePort } from '~/infra/database/ports/database.port'
import { ChannelsRepositoryPort } from '~/modules/v1/channels/ports/channels.repo.port'

@Injectable()
export class ChannelsDrizzleRepository extends ChannelsRepositoryPort {
  constructor(
    @Inject(DatabasePort)
    private readonly database: DatabasePort<Database>
  ) {
    super()
  }

  findAll(): Promise<Channel[]> {
    return this.database.client
      .select()
      .from(channelsTable)
      .orderBy(channelsTable.code)
  }

  async findById(id: string): Promise<Channel | null> {
    const [record] = await this.database.client
      .select()
      .from(channelsTable)
      .where(eq(channelsTable.id, id))
      .limit(1)

    return record ?? null
  }

  async findByCode(code: string): Promise<Channel | null> {
    const [record] = await this.database.client
      .select()
      .from(channelsTable)
      .where(eq(channelsTable.code, code))
      .limit(1)

    return record ?? null
  }

  async create(input: CreateChannelInput): Promise<Channel> {
    const [record] = await this.database.client
      .insert(channelsTable)
      .values({ code: input.code, name: input.name })
      .returning()

    if (!record) {
      throw new Error('Failed to create channel')
    }

    return record
  }

  async update(
    id: string,
    input: UpdateChannelInput
  ): Promise<Channel | null> {
    const [record] = await this.database.client
      .update(channelsTable)
      .set({
        ...(input.code !== undefined ? { code: input.code } : {}),
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.isActive !== undefined
          ? { isActive: input.isActive }
          : {}),
        updatedAt: new Date()
      })
      .where(eq(channelsTable.id, id))
      .returning()

    return record ?? null
  }
}
