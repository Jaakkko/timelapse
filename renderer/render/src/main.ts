import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import 'reflect-metadata'
import './logger'
import { processNext } from './messageQueue'
import { backOff as unconfiguredBackOff } from 'exponential-backoff'
import renderVideo from './renderVideo'
import progress from './progress'
import fs from 'fs'
import concatVideosSync from './concatVideosSync'

const backOff = <T>(request: () => Promise<T>) =>
  unconfiguredBackOff(request, { delayFirstAttempt: true })

void backOff(() =>
  processNext(async function task(keys) {
    logger.info('Got new message')
    console.log(keys)
    if (keys.length === 0 || (await progress.isConcatenated(keys[0]))) {
      logger.info('Discarding...')
      return
    }

    const renderedPath = `data/${new Date().toISOString()}.mp4`
    await renderVideo(keys, renderedPath)

    const newLongVideoFilename = new Date().toISOString() + '.mp4'
    const oldLongVideoFilename = await progress.getVideoFilename()
    if (oldLongVideoFilename) {
      logger.info('Concatenating videos')
      const oldLongVideoPath = `data/${oldLongVideoFilename}`
      const newLongVideoPath = `data/${newLongVideoFilename}`
      concatVideosSync(oldLongVideoPath, renderedPath, newLongVideoPath)
      fs.unlinkSync(oldLongVideoPath)
    } else {
      logger.info('No previous videos')
      fs.renameSync(renderedPath, `data/${newLongVideoFilename}`)
    }
    await progress.saveCheckpoint(keys[0], newLongVideoFilename)
    fs.unlinkSync(renderedPath)
    logger.info('Message processed')
  })
)
