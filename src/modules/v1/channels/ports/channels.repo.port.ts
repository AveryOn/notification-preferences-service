import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput
} from '~/modules/v1/channels/domain/channels.types'

export abstract class ChannelsRepoPort {
  abstract findAll(): Promise<Channel[]>
  abstract findById(id: string): Promise<Channel | null>
  abstract findByCode(code: string): Promise<Channel | null>
  abstract create(input: CreateChannelInput): Promise<Channel>
  abstract update(
    id: string,
    input: UpdateChannelInput
  ): Promise<Channel | null>
}
