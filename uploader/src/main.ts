import { install as installSourceMapSupport } from 'source-map-support'
installSourceMapSupport()

import config from './config'
import chokidar from 'chokidar'
import moveToS3 from './moveToS3'
import fs from 'fs'
import promiseLoop from './promiseLoop'

const watcher = chokidar.watch(config.watchDirectory, {
  awaitWriteFinish: true,
})

watcher.on('add', () => {
  promiseLoop.push(async () => {
    try {
      const list = await fs.promises.readdir(config.watchDirectory)
      for (const fileName of list) {
        await moveToS3(fileName)
      }
    } catch (error) {
      console.error(new Date().toLocaleString(), error)
    }
  })
})
