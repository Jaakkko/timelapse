import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import 'reflect-metadata'
import './logger'
import { processNext, connection as rabbitMQConnection } from './messageQueue'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import renderVideo from './renderVideo'
import progress from './progress'
import fs from 'fs'
import concatVideosSync from './concatVideosSync'

logger.info('Renderer started')

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

void backOff(() =>
  processNext(async function task(keys) {
    logger.info('Got new message')
    console.log(keys)
    if (keys.length === 0 || (await progress.isConcatenated(keys[0]))) {
      logger.warn('No keys or message already processed. Discarding!')
      return
    }

    const renderedFilename = `${new Date().toISOString()}.mp4`
    const renderedPath = `data/${renderedFilename}`
    await renderVideo(keys, renderedPath)

    const newLongVideoFilename = `${new Date().toISOString()}.mp4`
    const oldLongVideoFilename = await progress.getVideoFilename()
    if (oldLongVideoFilename) {
      logger.info('Concatenating videos')
      const newLongVideoPath = `data/${newLongVideoFilename}`
      const oldLongVideoPath = `data/${oldLongVideoFilename}`
      concatVideosSync(oldLongVideoFilename, renderedFilename, newLongVideoPath)
      fs.unlinkSync(oldLongVideoPath)
      fs.unlinkSync(renderedPath)
    } else {
      logger.info('No previous video')
      fs.renameSync(renderedPath, `data/${newLongVideoFilename}`)
    }
    await progress.saveCheckpoint(keys[0], newLongVideoFilename)
    logger.info('Message processed')
  })
)

process.on('SIGTERM', () => {
  rabbitMQConnection?.close()
  process.exit(0)
})
