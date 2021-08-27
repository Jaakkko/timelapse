import { S3, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import config from './config'
import { sendToQueue } from './messageQueue'

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

/**
 * @param StartAfter https://docs.aws.amazon.com/AmazonS3/latest/API/API_ListObjectsV2.html
 * @returns next StartAfter
 */
export async function goThroughTheList(
  StartAfter: string | undefined
): Promise<string> {
  let keys: string[]
  for (;;) {
    const { Contents } = await backOff(() =>
      s3.send(
        new ListObjectsV2Command({
          Bucket: config.bucket,
          StartAfter,
        })
      )
    )
    keys = (Contents || []).map((e) => e.Key as string)
    if (keys.length > 1) {
      StartAfter = keys[keys.length - 1]
    } else {
      break
    }

    await backOff(() => sendToQueue(JSON.stringify(keys)))
  }
  if (StartAfter === undefined) {
    throw new Error('No files found')
  }
  return StartAfter
}
