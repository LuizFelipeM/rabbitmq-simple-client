export interface QueueOptions {
  durable?: boolean
  exclusive?: boolean
}

export interface QueueBinding {
  exchange: string
  routingKey: string
}

export interface QueueQos {
  prefetchCount: number
}

export class QueueConfig {
  constructor(
    public name: string,
    public qos?: QueueQos,
    public options?: QueueOptions,
    public bidings?: QueueBinding[]) { }
}