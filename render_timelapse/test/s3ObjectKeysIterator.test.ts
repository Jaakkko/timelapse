import { mockClient } from 'aws-sdk-client-mock'
import { S3, ListObjectsV2Command } from '@aws-sdk/client-s3'
import s3ObjectKeysIterator from '../src/s3ObjectKeysIterator'

const S3Mock = mockClient(S3)

beforeEach(() => {
  S3Mock.reset()
})

it('should go through every item in the object list', async () => {
  S3Mock.on(ListObjectsV2Command)
    .resolves({
      Contents: new Array(2).fill(0).map((_, i) => ({ Key: i.toString() })),
    })
    .on(ListObjectsV2Command, { StartAfter: '1' })
    .resolves({
      Contents: [{ Key: '100' }],
    })

  const iterator = s3ObjectKeysIterator()
  expect([
    (await iterator.next()).value,
    (await iterator.next()).value,
    (await iterator.next()).value,
  ]).toStrictEqual(['0', '1', '100'])
})
