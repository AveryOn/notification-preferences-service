import type { DiProvider } from '~/core/di/types'
import { PreferencesService } from '~/modules/v1/preferences/domain/preferences.service'
import { PreferencesController } from '~/modules/v1/preferences/infra/http/preferences.controller'
import { PreferencesDrizzleRepository } from '~/modules/v1/preferences/infra/persistence/preferences.drizzle.repo'
import { PreferencesRepositoryPort } from '~/modules/v1/preferences/ports/preferences.repo.port'
import { PreferencesServicePort } from '~/modules/v1/preferences/ports/preferences.service.port'

export const preferencesProviders: DiProvider[] = [
  {
    token: PreferencesRepositoryPort,
    useClass: PreferencesDrizzleRepository
  },
  { token: PreferencesServicePort, useClass: PreferencesService },
  { token: PreferencesController, useClass: PreferencesController }
]
