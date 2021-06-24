import { PutObjectCommand, S3 } from '@aws-sdk/client-s3'
import path from 'path'
import fs from 'fs'
import config from './config'

const s3 = new S3({
  credentials: {
    accessKeyId: config.access,
    secretAccessKey: config.secret,
  },
  region: 'eu-north-1',
})

export default async function moveToS3(fileName: string): Promise<void> {
  const filePath = path.join(config.watchDirectory, fileName)

  await s3.send(
    new PutObjectCommand({
      Bucket: config.bucket,
      Key: fileName,
      Body: fs.createReadStream(filePath),
      ContentType: 'image/jpeg',
      StorageClass: 'STANDARD_IA',
    })
  )

  console.log(new Date().toLocaleString() + ' uploaded ' + fileName)

  await fs.promises.unlink(filePath)
}
