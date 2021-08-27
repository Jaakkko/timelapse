import { S3, GetObjectCommand } from '@aws-sdk/client-s3'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import os from 'os'
import { spawn } from 'child_process'
import { Readable } from 'stream'
import config from './config'
import ImageQueue from './imageQueue'

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

const ffmpegArgs = '-r 60 -f jpeg_pipe -i - -crf 17 -pix_fmt + -vcodec libx264'.split(' ')
ffmpegArgs.push('-threads')
ffmpegArgs.push(Math.max(1, os.cpus().length - 1).toString())

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

  let pipingTask: Promise<void> | null = null
  const imageQueue = new ImageQueue<Readable>(10)
  for (const key of s3ObjectKeys) {
    const { Body } = await backOff(() =>
      s3.send(
        new GetObjectCommand({
          Bucket: config.bucket,
          Key: key,
        })
      )
    )
    logger.verbose('Downloaded %s', key)
    await imageQueue.push(Body as Readable)
    logger.verbose('Pushed to queue %s', key)
    if (!pipingTask) {
      pipingTask = new Promise(function feed(resolve) {
        const readable = imageQueue.pop()
        if (!readable) {
          pipingTask = null
          resolve()
          return
        }

        readable.pipe(ffmpeg.stdin, { end: false })
        readable.on('end', () => feed(resolve))
      })
    }
  }

  if (pipingTask) {
    await pipingTask
  }

  ffmpeg.stdin.end()
  logger.info('Rendering done')
  await ffmpegExited
}
