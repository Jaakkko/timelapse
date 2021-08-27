export default class ImageQueue<T> {
  private items: T[]
  private resolveFull: (() => void) | null

  constructor(private maxLength: number) {
    this.items = []
    this.resolveFull = null
  }

  async push(item: T): Promise<void> {
    this.items.push(item)
    if (this.items.length > this.maxLength) {
      await new Promise<void>((resolve) => {
        this.resolveFull = resolve
      })
    }
  }

  pop(): T | undefined {
    if (this.resolveFull) {
      this.resolveFull()
    }
    return this.items.shift()
  }
}
