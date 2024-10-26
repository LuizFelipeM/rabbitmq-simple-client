import EventEmitter from "events";

interface AmqpEventEmitterEvents {
  messageWait: any[]
  messageFireAndForget: any[]
  newListener: any[]
}

export class AmqpEventEmitter extends EventEmitter<AmqpEventEmitterEvents> {
  public emitAndForget = this.emit

  public async emitAndWait(eventName: keyof AmqpEventEmitterEvents, ...args: any[]): Promise<boolean> {
    const listeners = this.listeners(eventName);

    if (!listeners || !listeners.length) return false

    const wrapper = this.listenerWrapper<void>(args)
    const promises = listeners.map(listener => wrapper(listener))

    await Promise.all(promises)
    return true
  }

  private listenerWrapper<T>(args: any[]) {
    return (listener: Function): Promise<T> => {
      try {
        const result = listener(...args)
        if (result instanceof Promise)
          return result

        return Promise.resolve(result)
      } catch (error) {
        return Promise.reject(error)
      }
    }
  }
}