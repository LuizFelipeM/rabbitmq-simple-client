# AMQP Simple Client
A simple wrapper of AMQP library enabling seamsly integration without effort

## Usage:
We need first to create an `AmqpClient` that will hold or connection so we can create as much producers and consumers we want:
```typescript
const client = new AmqpClient("<your_amqp_uri>")
```

with the client we can create a `Producer` and it will automatically create its exchange if doesn't exists:
```typescript
interface MyPayload {
    id: number
    name: string
}

const producer = client.createProducer<MyPayload>({
    name: "events",
    durable: true,
    type: "fanout"
})
```

than we can create a `Consumer` that automatically create its queue if doesn't exists like follow:
```typescript
const consumer = client.createConsumer<MyPayload>({
    name: "example-queue",
    options: {
        durable: true
    },
    bindings: {
      exchange: "events",
      routingKey: "example.events"
    }
})
```
> <span style="color:orange">**NOTE**</span> On the consumer options we have a way of binding its queue to exchanges, although if the exchange doesn't exists it will fail.

we can `publish` messages to our exchange through our `Producer`
```typescript
producer.publish({
    id: 123,
    name: "Luiz Moura"
}, "example.events")
```
> <span style="color:orange">**NOTE**</span><br/>
> The second parameter is the routing key, you can omit it if you aren't using.<br/>
> `publish` also has a third parameter that contains extra options for publishing messages to exchanges as, for example, `replyTo`, `headers`, and many more.

and finally we can `subscribe` to our `Consumer` and process the messages received:
```typescript
const subscription = consumer.subscribe(async ({ headers, payload }) => {
    await processMessage(headers, payload)
})
```

also if we don't need or don't want to consume messages anymore (for whatever reason) we can `unsubscribe` and end our subscription:
```typescript
subscription.unsubscribe()
```
> <span style="color:orange">**NOTE**</span> Unsubscribing stop consuming messages but doesn't delete de queue so you don't loose messages just because you aren't processing them.