import { Channel, connect } from "amqplib";

export abstract class BasicClient {
  constructor(protected url: string) { }

  protected async createChannel(): Promise<Channel> {
    const connection = await connect(this.url);
    return await connection.createChannel();
  }
}