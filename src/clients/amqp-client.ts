import { Channel, connect } from "amqplib";

export abstract class AmqpClient {
  constructor(private readonly url: string) { }

  protected async createChannel(): Promise<Channel> {
    const connection = await connect(this.url);
    return await connection.createChannel();
  }
}