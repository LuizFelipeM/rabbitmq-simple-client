import { Consumer } from "./consumer";
import { QueueConfig } from "../configs/queue-config";
import { ExchangeConfig } from "../configs/exchange-config";
import { Producer } from "./producer";

export class AmqpClient {
  constructor(private readonly url: string) { }

  public createConsumer<TPayload>(config: QueueConfig): Consumer<TPayload> {
    return new Consumer<TPayload>(this.url, config)
  }

  public createProducer<TPayload>(config: ExchangeConfig): Producer<TPayload> {
    return new Producer<TPayload>(this.url, config)
  }
}