import { QueueConfig } from "../configs/queue-config";
import { Channel } from 'amqplib';
import { BasicClient } from "./basic-client";
import { ConsumerMessage, ConsumerMessageHeaders } from "../types/consumer-message";
import { Subscription, SubscriptionType } from "../types/subscription";
import { AmqpEventEmitter } from "../types/amqp-event-emitter";
import { randomUUID } from "crypto";

export class Consumer<TPayload> extends BasicClient {
  private readonly eventEmitter = new AmqpEventEmitter()
  private readonly consumerTag = randomUUID()
  private channel?: Channel

  constructor(url: string, private readonly config: QueueConfig) {
    super(url)
    this.eventEmitter.once("newListener", this.consume.bind(this))
  }

  public subscribe(listener: (message: ConsumerMessage<TPayload>) => void): Subscription<TPayload>
  public subscribe(listener: (message: ConsumerMessage<TPayload>) => void, type: SubscriptionType = "wait"): Subscription<TPayload> {
    const subscription = new Subscription<TPayload>(
      this.eventEmitter,
      `message${this.capitalizeFirstLetter(type)}`,
      listener
    )

    subscription.on("noMoreListeners", () => {
      this.eventEmitter.once("newListener", this.consume.bind(this))
      this.cancel()
    })

    return subscription
  }

  private async cancel(): Promise<void> {
    if (this.channel)
      await this.channel.cancel(this.consumerTag)
  }

  private async consume(): Promise<void> {
    try {
      if (!this.channel)
        this.channel = await this.createChannel()

      this.createQueue(this.channel)

      this.channel.consume(
        this.config.name,
        async (message) => {
          if (message) {

            try {
              const payload = JSON.parse(message.content.toString())
              const headers: ConsumerMessageHeaders = { ...message.properties.headers }

              if (headers) {
                delete headers["x-first-death-exchange"]
                delete headers["x-first-death-queue"]
                delete headers["x-first-death-reason"]
                delete headers["x-death"]
              }

              // Commented for future implementation
              // this.eventEmitter.emitAndForget("messageFireAndForget", { headers, payload })

              await this.eventEmitter.emitAndWait("messageWait", { headers, payload })

              this.channel?.ack(message)
            } catch (error) {
              this.channel?.nack(message)
            }
          }
        },
        {
          consumerTag: this.consumerTag
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

  private capitalizeFirstLetter(val: string): string {
    return String(val).charAt(0).toUpperCase() + String(val).slice(1);
  }
}