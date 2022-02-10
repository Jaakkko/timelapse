import ParallelPromiseQueue from '../src/parallelPromiseQueue'

test('order', async () => {
  const results: number[] = []
  const queue = new ParallelPromiseQueue<number>(2, (a) => {
    results.push(a)
    return Promise.resolve()
  })
  await queue.pushPromise(
    new Promise<number>((resolve) => setTimeout(() => resolve(1), 5))
  )
  await queue.pushPromise(
    new Promise<number>((resolve) => setTimeout(() => resolve(2), 10))
  )
  await queue.allProcessed()
  expect(results).toStrictEqual([1, 2])
})