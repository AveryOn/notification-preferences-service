import type {
  Channel,
  CreateChannelInput,
  UpdateChannelInput
} from '~/modules/v1/channels/domain/channels.types'

export abstract class ChannelsServicePort {
  abstract getAll(): Promise<Channel[]>
  abstract create(input: CreateChannelInput): Promise<Channel>
  abstract update(id: string, input: UpdateChannelInput): Promise<Channel>
}
