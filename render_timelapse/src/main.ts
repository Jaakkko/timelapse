import './logger'
import ParallelPromiseQueue from './parallelPromiseQueue'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import { spawn } from 'child_process'
import { Readable } from 'stream'
import config from './config'
import s3ObjectKeysIterator from './s3ObjectKeysIterator'
import { GetObjectCommand, S3 } from '@aws-sdk/client-s3'
import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

const cacheSize = 50
const ffmpegArgs = `-r 60 -f jpeg_pipe -i pipe: -b:v 20M output.webm`.split(' ')

const ffmpeg = spawn('ffmpeg', ffmpegArgs)
logger.info(`$ ffmpeg ${ffmpegArgs.join(' ')}`)
ffmpeg.stderr.on('data', (msg) => logger.error(msg))
const ffmpegExited = new Promise<void>((resolve, reject) => {
  ffmpeg.on('close', (code) => {
    if (code !== 0) {
      reject(new Error('ffmpeg exited with non-zero exit code'))
      return
    }
    resolve()
  })
})

logger.info('%o', ffmpegExited)

const queue = new ParallelPromiseQueue<{ buffer: Buffer; key: string }>(
  cacheSize,
  ({ buffer, key }) =>
    new Promise((resolve) => {
      logger.verbose('%s -> ffmpeg', key)
      ffmpeg.stdin.write(buffer, (err) => {
        if (err) throw err
        logger.verbose('%s processed', key)
        resolve()
      })
    })
)

void (async function () {
  const iterator = s3ObjectKeysIterator()
  for await (const key of iterator) {
    await queue.pushPromise(
      backOff(() =>
        s3.send(
          new GetObjectCommand({
            Bucket: config.bucket,
            Key: key,
          })
        )
      ).then(
        ({ Body, ContentLength }) =>
          new Promise((resolve) => {
            const buffer = Buffer.allocUnsafe(ContentLength as number)
            const readableBody = Body as Readable
            let bufferWritePos = 0
            readableBody.on('data', (chunk: Buffer) => {
              chunk.copy(buffer, bufferWritePos)
              bufferWritePos += chunk.byteLength
            })
            readableBody.on('end', () => {
              logger.verbose('%s downloaded', key)
              resolve({
                buffer,
                key,
              })
            })
          })
      )
    )
  }

  await queue.allProcessed()

  ffmpeg.stdin.end()
  logger.info('Waiting ffmpeg...')
  await ffmpegExited
  logger.info('Timelapse video rendered')
})()
