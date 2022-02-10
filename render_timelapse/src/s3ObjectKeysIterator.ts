import { S3, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import config from './config'

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

export default async function* s3ObjectKeysIterator(): AsyncGenerator<
  string,
  void,
  void
> {
  const buffer: string[] = []
  let StartAfter: string | undefined = undefined
  while (true) {
    if (buffer.length === 0) {
      const { Contents } = await backOff(() =>
        s3.send(
          new ListObjectsV2Command({
            Bucket: config.bucket,
            StartAfter,
          })
        )
      )
      const keys = (Contents || []).map((e) => e.Key as string)
      if (keys.length === 0) {
        break
      }
      StartAfter = keys[keys.length - 1]
      buffer.push(...keys)
    }

    const val = buffer.shift()
    yield val as string
  }
}
