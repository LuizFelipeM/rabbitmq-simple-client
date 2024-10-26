import EventEmitter from "events"
import { ConsumerMessage } from "./consumer-message"

export type SubscriptionType = "wait" | "fireAndForget"

interface SubscriptionEvents {
  unsubscribe: any[]
  noMoreListeners: any[]
}

export class Subscription<TPayload> extends EventEmitter<SubscriptionEvents> {
  constructor(
    private readonly eventEmitter: EventEmitter,
    private readonly eventName: string,
    private readonly eventListener: (message: ConsumerMessage<TPayload>) => void) {
    super()
    this.eventEmitter.on(this.eventName, this.eventListener)
  }

  public unsubscribe() {
    this.eventEmitter.off(this.eventName, this.eventListener)
    this.emit("unsubscribe")
    if (!this.eventEmitter.listenerCount(this.eventName))
      this.emit("noMoreListeners", this.eventName)
  }
}