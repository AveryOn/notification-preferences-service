import type { DiProvider } from '~/core/di'
import { ChannelsService } from '~/modules/v1/channels/domain/channels.service'
import { ChannelsController } from '~/modules/v1/channels/infra/http/channels.controller'
import { ChannelsDrizzleRepository } from '~/modules/v1/channels/infra/persistence/channels.drizzle.repo'
import { ChannelsRepositoryPort } from '~/modules/v1/channels/ports/channels.repo.port'
import { ChannelsServicePort } from '~/modules/v1/channels/ports/channels.service.port'

export const channelsProviders: DiProvider[] = [
  { token: ChannelsRepositoryPort, useClass: ChannelsDrizzleRepository },
  { token: ChannelsServicePort, useClass: ChannelsService },
  { token: ChannelsController, useClass: ChannelsController }
]
