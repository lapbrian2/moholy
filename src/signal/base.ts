/**
 * Base signal interface and shared buffer logic.
 * Every signal source implements this contract.
 */

export interface SignalOptions {
  /** Number of independent data channels */
  channels?: number
  /** Normalize values to 0-1 range (default: true) */
  normalize?: boolean
}

export interface Signal {
  /** Current signal values (Float32Array, one per channel) */
  readonly data: Float32Array
  /** Number of channels */
  readonly channels: number
  /** Whether the signal is currently active */
  readonly active: boolean
  /** Start receiving data */
  connect(): void
  /** Stop receiving + cleanup */
  disconnect(): void
  /** Per-frame update hook (call in your render loop) */
  update(dt: number): void
  /** Register a callback for when new data arrives */
  onData(callback: (data: Float32Array) => void): () => void
}

export abstract class BaseSignal implements Signal {
  protected _data: Float32Array
  protected _active = false
  protected _listeners: Array<(data: Float32Array) => void> = []

  constructor(channels: number) {
    this._data = new Float32Array(channels)
  }

  get data(): Float32Array {
    return this._data
  }

  get channels(): number {
    return this._data.length
  }

  get active(): boolean {
    return this._active
  }

  abstract connect(): void
  abstract disconnect(): void

  update(_dt: number): void {
    // Override in subclasses that need per-frame updates
  }

  onData(callback: (data: Float32Array) => void): () => void {
    this._listeners.push(callback)
    return () => {
      this._listeners = this._listeners.filter((l) => l !== callback)
    }
  }

  protected emit(): void {
    for (const listener of this._listeners) {
      listener(this._data)
    }
  }

  protected setChannel(index: number, value: number): void {
    if (index < this._data.length) {
      this._data[index] = value
    }
  }
}
