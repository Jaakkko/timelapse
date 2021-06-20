import { install as installSourceMapSupport } from 'source-map-support'
installSourceMapSupport()

import runEveryTenthMinute from './runEveryTenthMinute'
import shoot from './shoot'

runEveryTenthMinute(shoot)
