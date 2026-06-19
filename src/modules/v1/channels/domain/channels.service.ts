import {
  type Channel,
  type CreateChannelInput,
  type UpdateChannelInput
} from '~/modules/v1/channels/domain/channels.types'

import { Inject, Injectable } from '~/core/di'
import {
  ChannelCodeConflictError,
  ChannelNotFoundError
} from '~/modules/v1/channels/domain/channels.types'
import { ChannelsRepoPort } from '~/modules/v1/channels/ports/channels.repo.port'
import { ChannelsServicePort } from '~/modules/v1/channels/ports/channels.service.port'

@Injectable()
export class ChannelsService extends ChannelsServicePort {
  constructor(
    @Inject(ChannelsRepoPort)
    private readonly repository: ChannelsRepoPort
  ) {
    super()
  }

  getAll(): Promise<Channel[]> {
    return this.repository.findAll()
  }

  async create(input: CreateChannelInput): Promise<Channel> {
    const existing = await this.repository.findByCode(input.code)

    if (existing) {
      throw new ChannelCodeConflictError(
        `Channel code already exists: ${input.code}`
      )
    }

    return this.repository.create(input)
  }

  async update(id: string, input: UpdateChannelInput): Promise<Channel> {
    const current = await this.repository.findById(id)

    if (!current) {
      throw new ChannelNotFoundError(`Channel was not found: ${id}`)
    }

    if (input.code && input.code !== current.code) {
      const existing = await this.repository.findByCode(input.code)

      if (existing) {
        throw new ChannelCodeConflictError(
          `Channel code already exists: ${input.code}`
        )
      }
    }

    const updated = await this.repository.update(id, input)

    if (!updated) {
      throw new ChannelNotFoundError(`Channel was not found: ${id}`)
    }

    return updated
  }
}
