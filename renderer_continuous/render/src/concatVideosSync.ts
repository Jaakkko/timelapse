import fs from 'fs'
import { spawnSync } from 'child_process'

/**
 * Concatenate two videos on `data` directory
 */
export default function concatVideosSync(
  firstFilename: string,
  secondFilename: string,
  destPath: string
): void {
  const joinFileContent = `file '${firstFilename}'\nfile '${secondFilename}'\n`
  fs.writeFileSync('data/join.txt', joinFileContent, { encoding: 'utf-8' })

  const ffmpegArgs = `-f concat -safe 0 -i data/join.txt -c copy`.split(' ')
  ffmpegArgs.push(destPath)

  const { status, stderr } = spawnSync('ffmpeg', ffmpegArgs)
  if (status !== 0) {
    throw new Error(
      `Concatenation failed! status: ${status}, stderr: ${stderr.toString()}`
    )
  }
}
