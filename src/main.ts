import 'reflect-metadata'

import { appProviders } from '~/core/app/app.providers'
import { HTTP_SERVER_TOKEN } from '~/core/app/app.tokens'
import { DiModule } from '~/core/di/di.module'
import type { HttpServer } from '~/infra/transport/http/http.server'

const container = new DiModule().bootstrap(appProviders)

const httpServer = container.resolve<HttpServer>(HTTP_SERVER_TOKEN)

httpServer.start()
