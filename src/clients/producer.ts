import { Channel, Options } from "amqplib";
import { ExchangeConfig } from "../configs/exchange-config";
import { BasicClient } from "./basic-client";

export class Producer<TPayload> extends BasicClient {
  constructor(url: string, private readonly config: ExchangeConfig) {
    super(url)
  }

  public async publish(payload: TPayload, routingKey = "", options?: Options.Publish): Promise<void> {
    try {
      const channel = await this.createChannel()
      this.createExchange(channel)
      if (!channel.publish(this.config.name, routingKey, Buffer.from(JSON.stringify(payload)), options))
        throw new Error("Unexpected error occur, AMQP publish method did not return sucess.")
    } catch (error) {
      console.error("Error publishing message: ", error)
      throw error
    }
  }

  private createExchange(channel: Channel) {
    channel.assertExchange(this.config.name, this.config.type, { durable: this.config.durable })
  }
}