import { BaseSignal } from './base'

export interface FetchSignalOptions {
  /** Polling interval in ms (default: 5000) */
  interval?: number
  /** Parse response to number array */
  parse?: (response: unknown) => number[]
  /** Number of channels */
  channels?: number
  /** Fetch init options */
  fetchOptions?: RequestInit
}

export class FetchSignal extends BaseSignal {
  private url: string
  private opts: Required<Omit<FetchSignalOptions, 'fetchOptions'>> & { fetchOptions: RequestInit }
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(url: string, options: FetchSignalOptions = {}) {
    const channels = options.channels ?? 8
    super(channels)
    this.url = url
    this.opts = {
      interval: options.interval ?? 5000,
      parse: options.parse ?? defaultParse,
      channels,
      fetchOptions: options.fetchOptions ?? {},
    }
  }

  connect(): void {
    if (this._active) return
    this._active = true
    this.poll() // immediate first fetch
    this.timer = setInterval(() => this.poll(), this.opts.interval)
  }

  disconnect(): void {
    this._active = false
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  }

  private async poll(): Promise<void> {
    try {
      const res = await fetch(this.url, this.opts.fetchOptions)
      const json = await res.json()
      const values = this.opts.parse(json)
      const len = Math.min(values.length, this._data.length)
      for (let i = 0; i < len; i++) {
        this._data[i] = values[i]
      }
      this.emit()
    } catch {
      // Silent fail — signal stays at last known values
    }
  }
}

function defaultParse(data: unknown): number[] {
  if (Array.isArray(data)) return data
  if (data && typeof data === 'object') return Object.values(data as Record<string, number>)
  return []
}
