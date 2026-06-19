import type { DiProvider } from '~/core/di'
import { ChannelsService } from '~/modules/v1/channels/domain/channels.service'
import { ChannelsController } from '~/modules/v1/channels/infra/http/channels.controller'
import { ChannelsDrizzleRepo } from '~/modules/v1/channels/infra/persistence/channels.drizzle.repo'
import { ChannelsRepoPort } from '~/modules/v1/channels/ports/channels.repo.port'
import { ChannelsServicePort } from '~/modules/v1/channels/ports/channels.service.port'

export const channelsProviders: DiProvider[] = [
  { token: ChannelsRepoPort, useClass: ChannelsDrizzleRepo },
  { token: ChannelsServicePort, useClass: ChannelsService },
  { token: ChannelsController, useClass: ChannelsController }
]
