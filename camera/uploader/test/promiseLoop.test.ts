import promiseLoop from '../src/promiseLoop'

jest.setTimeout(10000)

test('sync', async () => {
  const list: number[] = []

  promiseLoop.push(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          console.log(1)
          list.push(1)
          resolve()
        }, 1000)
      })
  )
  promiseLoop.push(
    () =>
      new Promise((_resolve, reject) => {
          console.log(2)
        setTimeout(reject, 700)
      })
  )
  promiseLoop.push(
    () =>
      new Promise((resolve) => {
        setTimeout(() => {
          console.log(3)
          list.push(2)
          resolve()
        }, 500)
      })
  )

  await new Promise((resolve) => setTimeout(resolve, 3000))

  expect(list).toStrictEqual([1, 2])
})
