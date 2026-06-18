export abstract class DatabasePort<TClient = unknown> {
  abstract readonly client: TClient

  abstract ping(): Promise<void>
  abstract close(): Promise<void>
}
