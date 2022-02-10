import { createLogger, format, transports } from 'winston'

global.logger = createLogger({
  level: 'silly',
  transports: [
    new transports.Console({
      format: format.combine(
        format.timestamp(),
        format.cli(),
        format.splat(),
        format.printf(
          ({ level, message, timestamp }) => `${timestamp} ${level} ${message}`
        )
      ),
    }),
  ],
})
