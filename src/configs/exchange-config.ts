export type ExchangeType = "direct" | "topic" | "headers" | "fanout" | "match"

export class ExchangeConfig {
  constructor(
    public name: string,
    public type: ExchangeType,
    public durable: boolean) { }
}