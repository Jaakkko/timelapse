import amqplib from 'amqplib'

let channel: amqplib.Channel | null = null
export let connection: amqplib.Connection | null = null

const QUEUE_NAME = 'filenames'

export async function processNext(
  callback: (keys: string[]) => Promise<void>
): Promise<void> {
  if (channel === null) {
    connection = await amqplib.connect('amqp://mq')
    channel = await connection.createChannel()
    await channel.prefetch(1)
    await channel.assertQueue(QUEUE_NAME, { durable: true })
  }

  const channelRef = channel
  await channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (msg === null) {
        return
      }

      await callback(JSON.parse(msg.content.toString('utf-8')))
      channelRef.ack(msg)
    },
    {
      noAck: false,
    }
  )
}
