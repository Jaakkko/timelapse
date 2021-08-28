import env from 'dotenv'
const result = env.config()

if (result.error) {
  throw result.error
}

function findEnv<T extends string>(...values: T[]): Record<T, string> {
  const result: Record<string, string> = {}
  values.forEach((key) => {
    const value = process.env[key]
    if (!value) throw new Error(key + ' env is not defined')
    result[key] = value
  })
  return result
}

const config = findEnv(
  'access',
  'secret',
  'bucket',
  'database',
  'averageImageSizeInMegaBytes',
  'maxMemoryConsumptionPercent',
  'maxMemoryConumptionMegaBytes'
)

export default config
