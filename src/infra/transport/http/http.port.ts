import type { Server } from 'node:http'

export abstract class HttpServerPort {
  abstract start(): Server
}
