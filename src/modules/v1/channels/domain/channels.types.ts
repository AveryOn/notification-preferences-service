export interface Channel {
  id: string
  code: string
  name: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

export interface CreateChannelInput {
  code: string
  name: string
}

export interface UpdateChannelInput {
  code?: string
  name?: string
  isActive?: boolean
}

export class ChannelNotFoundError extends Error {
  override readonly name = 'ChannelNotFoundError'
}

export class ChannelCodeConflictError extends Error {
  override readonly name = 'ChannelCodeConflictError'
}
