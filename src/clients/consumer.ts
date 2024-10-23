import { AmqpClient } from "./amqp-client";
import { QueueConfig } from "../configs/queue-config";
import { Channel } from 'amqplib';
import { EventEmitter } from "stream";

export type Headers = { [key: string]: any }

export interface ConsumerMessage<TPayload> {
  headers?: Headers
  payload: TPayload
}

export class Subscription<TPayload> {
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly eventName: string,
    private readonly eventListener: (message: ConsumerMessage<TPayload>) => void,
    private readonly onNoListeners?: (eventName: string) => void) {
    this.eventEmitter.on(this.eventName, this.eventListener)
  }

  public unsubscribe() {
    this.eventEmitter.off(this.eventName, this.eventListener)
    if (!this.eventEmitter.listenerCount(this.eventName))
      this.onNoListeners?.(this.eventName)
  }
}

export class Consumer<TPayload> extends AmqpClient {
  private readonly eventEmitter = new EventEmitter()

  constructor(url: string, private readonly config: QueueConfig) {
    super(url)
    this.eventEmitter.once("newListener", this.consume.bind(this))
  }

  public subscribe(listener: (message: ConsumerMessage<TPayload>) => void): Subscription<TPayload> {
    return new Subscription<TPayload>(
      this.eventEmitter,
      "message",
      listener,
      () => this.eventEmitter.once("newListener", this.consume)
    )
  }

  private async consume(): Promise<void> {
    try {
      const channel = await this.createChannel()
      this.createQueue(channel)

      channel.consume(this.config.name, (message) => {
        if (message) {
          const payload = JSON.parse(message.content.toString())
          const headers: Headers = { ...message.properties.headers }

          if (headers) {
            delete headers["x-first-death-exchange"]
            delete headers["x-first-death-queue"]
            delete headers["x-first-death-reason"]
            delete headers["x-death"]
          }

          this.eventEmitter.emit("message", { headers, payload })
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

    if (this.config.bindings && this.config.bindings.length) {
      await Promise.all(this.config.bindings.map(({ exchange, routingKey }) =>
        channel.bindQueue(this.config.name, exchange, routingKey)))
    }

    channel.prefetch(this.config.qos?.prefetchCount ?? 0)
  }
}