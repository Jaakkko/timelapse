import { S3, GetObjectCommand } from '@aws-sdk/client-s3'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import os from 'os'
import { spawn } from 'child_process'
import { Readable } from 'stream'
import config from './config'
import ParallelPromiseQueue from './parallelPromiseQueue'

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

const ffmpegArgs =
  '-r 60 -f jpeg_pipe -i pipe: -crf 17 -pix_fmt + -vcodec libx264'.split(' ')
ffmpegArgs.push('-threads')
ffmpegArgs.push(Math.max(1, os.cpus().length - 1).toString())

function calculateQueueSize(): number {
  const avgSize = parseFloat(config.averageImageSizeInMegaBytes) * 1048576
  const maxUsage = parseFloat(config.maxMemoryConsumptionPercent) * 0.01
  const maxMemory = parseFloat(config.maxMemoryConumptionMegaBytes) * 1048576
  return Math.floor((Math.min(os.freemem(), maxMemory) * maxUsage) / avgSize)
}

export default async function renderVideo(
  s3ObjectKeys: string[],
  destinationPath: string
): Promise<void> {
  logger.info(
    `Rendering video of %d images to file:%s`,
    s3ObjectKeys.length,
    destinationPath
  )
  const args = [...ffmpegArgs, destinationPath]
  const ffmpeg = spawn('ffmpeg', args)
  logger.info(`ffmpeg ${args.join(' ')}`)
  ffmpeg.stderr.on('data', (msg) => logger.error('ffmpeg: %s', msg))
  const ffmpegExited = new Promise<void>((resolve, reject) => {
    ffmpeg.on('close', (code) => {
      if (code !== 0) {
        reject(new Error('ffmpeg exited with non-zero exit code'))
        return
      }
      resolve()
    })
  })

  const queueLength = calculateQueueSize()
  logger.info('Creating queue with length %d', queueLength)
  const queue = new ParallelPromiseQueue<{ buffer: Buffer; key: string }>(
    queueLength,
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

  for (const key of s3ObjectKeys) {
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
  logger.info('Rendering done')
}
