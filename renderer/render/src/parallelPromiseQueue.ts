export default class ParallelPromiseQueue<T> {
  private queue: Promise<T>[]
  private resolveAllProcessed: (() => void) | null
  private resolveQueueNotFull: (() => void) | null
  private isProcessing: boolean

  constructor(
    private maxLength: number,
    private consume: (item: T) => Promise<void>
  ) {
    this.queue = []
    this.resolveAllProcessed = null
    this.resolveQueueNotFull = null
    this.isProcessing = false
  }

  private process(): void {
    if (this.isProcessing) {
      return
    }
    this.isProcessing = true

    const actualProcessing = () => {
      const item = this.queue.shift()
      if (item) {
        void item.then(this.consume).then(() => {
          if (this.resolveQueueNotFull) {
            this.resolveQueueNotFull()
            this.resolveQueueNotFull = null
          }
          actualProcessing()
        })
      } else {
        this.isProcessing = false
        if (this.resolveAllProcessed) {
          this.resolveAllProcessed()
          this.resolveAllProcessed = null
        }
      }
    }
    actualProcessing()
  }

  async pushPromise(promise: Promise<T>): Promise<void> {
    this.queue.push(promise)
    if (this.queue.length >= this.maxLength) {
      await new Promise<void>((resolve) => {
        this.resolveQueueNotFull = resolve
        this.process()
      })
    } else {
      this.process()
    }
  }

  allProcessed(): Promise<void> {
    return new Promise((resolve) => {
      this.resolveAllProcessed = resolve
    })
  }
}
