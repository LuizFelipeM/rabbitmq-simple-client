import { Subject } from 'rxjs';
import { AmqpClient } from "./amqp-client";
import { QueueConfig } from "../configs/queue-config";
import { Channel } from 'amqplib';

export type Headers = { [key: string]: any }

export interface ConsumerMessage<TPayload> {
  headers?: Headers
  payload: TPayload
}

export class Consumer<TPayload> extends AmqpClient {
  private readonly subject = new Subject<ConsumerMessage<TPayload>>()

  constructor(url: string, private readonly config: QueueConfig) {
    super(url)
  }

  public subscribe = this.subject.subscribe
  public unsubscribe = this.subject.unsubscribe

  public async consume(): Promise<void> {
    try {
      const channel = await this.createChannel()
      this.createQueue(channel)

      channel.consume(this.config.name, (message) => {
        if (message) {
          const payload = JSON.parse(message.content.toString())
          const headers = { ...message.properties.headers }

          if (headers) {
            delete headers["x-first-death-exchange"]
            delete headers["x-first-death-queue"]
            delete headers["x-first-death-reason"]
            delete headers["x-death"]
          }

          this.subject.next({ headers, payload })
          channel.ack(message)
        }
      })
    } catch (error) {
      console.error("Error consuming messages: ", error)
      throw error
    }
  }

  private async createQueue(channel: Channel): Promise<void> {
    if (this.config.options) {
      await channel.assertQueue(this.config.name, {
        durable: this.config.options?.durable,
        exclusive: this.config.options.exclusive
      })
    }

    if (this.config.bidings && this.config.bidings.length) {
      await Promise.all(
        this.config.bidings.map(({ exchange, routingKey }) =>
          channel.bindQueue(this.config.name, exchange, routingKey)
        ))
    }

    channel.prefetch(this.config.qos?.prefetchCount ?? 0)
  }
}