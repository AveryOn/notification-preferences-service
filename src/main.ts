import type { HttpServerPort } from '~/infra/transport/http'

import 'reflect-metadata'
import { appProviders } from '~/app/app.providers'
import { HTTP_SERVER_TOKEN } from '~/app/app.tokens'
import { DiModule } from '~/core/di'

const container = new DiModule().bootstrap(appProviders)

const httpServer = container.resolve<HttpServerPort>(HTTP_SERVER_TOKEN)

httpServer.start()
