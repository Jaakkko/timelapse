import fs from 'fs'

export default class PersistentVariable {
  private value: string | undefined
  private filename: string

  constructor(private name: string) {
    this.value = undefined
    this.filename = `data/${name}`
  }

  get(): string | undefined {
    if (this.value) {
      return this.value
    }

    try {
      this.value = fs.readFileSync(this.filename, 'utf-8')
    } catch (error) {
      //
    }
    return this.value
  }

  set(value: string): void {
    fs.writeFileSync(this.filename, value, { encoding: 'utf-8' })
  }
}
