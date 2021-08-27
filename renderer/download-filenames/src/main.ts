import sourceMapSupport from 'source-map-support'
sourceMapSupport.install()

import { connection as rabbitMQConnection } from './messageQueue'
import process from 'process'
import { CronJob } from 'cron'
import { goThroughTheList } from './goThroughTheList'
import PersistentVariable from './persistentVariable'
import config from './config'
import './logger'

let listingJob: Promise<string> | null = null
const startAfter = new PersistentVariable('startAfter')

new CronJob(
  '0 0 * * *',
  async () => {
    if (listingJob === null) {
      try {
        listingJob = goThroughTheList(startAfter.get())
        startAfter.set(await listingJob)
      } catch (error) {
        logger.error('%o', error)
      } finally {
        listingJob = null
      }
    }
  },
  null,
  true,
  config.timezone,
  undefined,
  true
).start()

process.on('SIGTERM', () => {
  rabbitMQConnection?.close()
  process.exit(0)
})
