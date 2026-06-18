import type { DiProvider } from '~/core/di/types'
import { QuietHoursService } from '~/modules/v1/quiet-hours/domain/quiet-hours.service'
import { QuietHoursController } from '~/modules/v1/quiet-hours/infra/http/quiet-hours.controller'
import { QuietHoursDrizzleRepository } from '~/modules/v1/quiet-hours/infra/persistence/quiet-hours.drizzle.repo'
import { QuietHoursRepositoryPort } from '~/modules/v1/quiet-hours/ports/quiet-hours.repo.port'
import { QuietHoursServicePort } from '~/modules/v1/quiet-hours/ports/quiet-hours.service.port'

export const quietHoursProviders: DiProvider[] = [
  {
    token: QuietHoursRepositoryPort,
    useClass: QuietHoursDrizzleRepository
  },
  { token: QuietHoursServicePort, useClass: QuietHoursService },
  { token: QuietHoursController, useClass: QuietHoursController }
]
