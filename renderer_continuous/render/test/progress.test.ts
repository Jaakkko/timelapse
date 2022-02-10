import fs from 'fs'
import config from '../src/config'
import progress from '../src/progress'

test('saveCheckpoint', async () => {
  try {
    fs.unlinkSync('data/test')
  } catch (error) {
    //
  }
  config.database = 'data/test'
  const key = 'myKey'
  const video = 'video'
  expect(await progress.isConcatenated(key)).toBeFalsy()
  await progress.saveCheckpoint(key, video)
  expect(await progress.isConcatenated(key)).toBeTruthy()
})
