export type ConsumerMessageHeaders = { [key: string]: any }

export interface ConsumerMessage<TPayload> {
  headers?: ConsumerMessageHeaders
  payload: TPayload
}