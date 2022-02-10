import amqplib from 'amqplib'

let channel: amqplib.ConfirmChannel | null = null
export let connection: amqplib.Connection | null = null

const QUEUE_NAME = 'filenames'

export async function sendToQueue(message: string): Promise<void> {
  if (channel === null) {
    connection = await amqplib.connect('amqp://mq')
    channel = await connection.createConfirmChannel()
    await channel.assertQueue(QUEUE_NAME, { durable: true })
  }

  const channelRef = channel
  return new Promise<void>((resolve, reject) => {
    channelRef.sendToQueue(
      QUEUE_NAME,
      Buffer.from(message),
      { persistent: true },
      (err) => {
        if (err) {
          reject(err)
        } else {
          resolve()
        }
      }
    )
  })
}
