import { createConnection, Connection } from 'typeorm'
import { Checkpoint } from './entity/Checkpoint'

let connection: Connection | null

async function getConnection(): Promise<Connection> {
  if (!connection) {
    connection = await createConnection({
      type: 'sqlite',
      database: 'data/progress',
      entities: [Checkpoint],
      synchronize: true,
      logging: false,
    })
  }
  return connection
}

async function isConcatenated(firstKey: string): Promise<boolean> {
  const connection = await getConnection()
  const repository = connection.getRepository(Checkpoint)
  const count = await repository.count({ firstKey })
  return count === 1
}

async function getVideoFilename(): Promise<string | undefined> {
  const connection = await getConnection()
  const repository = connection.getRepository(Checkpoint)
  const found = await repository
    .createQueryBuilder('checkpoint')
    .select(['checkpoint.videoFilename'])
    .orderBy('firstKey', 'DESC')
    .limit(1)
    .getOne()
  console.log(found)
  return found?.videoFilename
}

async function saveCheckpoint(
  firstKey: string,
  videoFilename: string
): Promise<void> {
  const connection = await getConnection()
  const checkpoint = new Checkpoint()
  checkpoint.firstKey = firstKey
  checkpoint.videoFilename = videoFilename
  await connection.manager.save(checkpoint)
}

export default {
  isConcatenated,
  getVideoFilename,
  saveCheckpoint,
}
