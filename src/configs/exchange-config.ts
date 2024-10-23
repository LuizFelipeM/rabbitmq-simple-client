export type ExchangeType = "direct" | "topic" | "headers" | "fanout" | "match" | string

export class ExchangeConfig {
  constructor(
    public name: string,
    public type: ExchangeType,
    public durable: boolean) { }
}