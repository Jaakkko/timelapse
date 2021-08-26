import { spawn } from 'child_process'
import config from './config'

export default function shoot(): void {
  const cmd = 'raspistill'
  const args = [
    '-e',
    'jpg',
    '-dt',
    '-w',
    '1920',
    '-h',
    '1080',
    '--exposure',
    'auto',
    '--flicker',
    'auto',
    '--awb',
    'auto',
    '--quality',
    '100',
    '--sharpness',
    '100',
    '-o',
  ]

  const fileName = new Date().toISOString()
  args.push(fileName)

  spawn(cmd, args, {
    cwd: config.watchDirectory,
  })
}
