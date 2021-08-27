import ImageQueue from '../src/imageQueue'

describe('push', () => {
  it("shouldn't resolve promise if max amount of items", async () => {
    const cb = jest.fn()
    const queue = new ImageQueue<number>(1)
    await queue.push(1)
    void queue.push(2).then(cb)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cb).not.toBeCalled()
        resolve()
      }, 0)
    })
  })
})

describe('pop', () => {
  it('should resolve promise after pop() if max amount of items', async () => {
    const cb = jest.fn()
    const queue = new ImageQueue<number>(1)
    await queue.push(1)
    void queue.push(2).then(cb)
    const popped = queue.pop()
    expect(popped).toBe(1)
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        expect(cb).toBeCalled()
        resolve()
      }, 0)
    })
  })
})
