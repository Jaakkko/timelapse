import fs from 'fs'
import { spawnSync } from 'child_process'

export default function concatVideosSync(
  firstPath: string,
  secondPath: string,
  destPath: string
): void {
  const joinFileContent = `file '${firstPath}'\nfile '${secondPath}'\n`
  fs.writeFileSync('data/join.txt', joinFileContent, { encoding: 'utf-8' })

  const ffmpegArgs = `-f concat -safe 0 -i data/join.txt -c copy`.split(' ')
  ffmpegArgs.push(destPath)

  spawnSync('ffmpeg', ffmpegArgs)
}
