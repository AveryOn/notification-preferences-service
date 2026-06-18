import { DiContainer } from '~/core/di/di.container'
import type { DiContainerPort } from '~/core/di/ports/di.container.port'
import type { DiProvider } from '~/core/di/types'

export class DiModule {
  private readonly container: DiContainerPort

  constructor() {
    this.container = new DiContainer()
  }

  bootstrap(providers: DiProvider[]): DiContainerPort {
    this.container.register(providers)

    return this.container
  }
}
