import { BaseSignal } from './base'

/**
 * Static or manually-updated signal source.
 * Pass an array of values, update with .set().
 */
export class ArraySignal extends BaseSignal {
  constructor(data: number[] | Float32Array) {
    super(data.length)
    if (data instanceof Float32Array) {
      this._data.set(data)
    } else {
      for (let i = 0; i < data.length; i++) {
        this._data[i] = data[i]
      }
    }
  }

  connect(): void {
    this._active = true
  }

  disconnect(): void {
    this._active = false
  }

  /** Update all channels at once */
  set(data: number[] | Float32Array): void {
    const len = Math.min(data.length, this._data.length)
    for (let i = 0; i < len; i++) {
      this._data[i] = data instanceof Float32Array ? data[i] : data[i]
    }
    this.emit()
  }

  /** Update a single channel */
  setChannel(index: number, value: number): void {
    super.setChannel(index, value)
    this.emit()
  }
}
