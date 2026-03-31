import { BaseSignal } from './base'

export interface WebSocketSignalOptions {
  /** Parse incoming message to Float32Array (default: JSON array) */
  parse?: (data: MessageEvent['data']) => number[]
  /** Auto-reconnect on close (default: true) */
  reconnect?: boolean
  /** Reconnect delay in ms (default: 2000) */
  reconnectDelay?: number
  /** Number of channels (required if parse is custom) */
  channels?: number
}

export class WebSocketSignal extends BaseSignal {
  private ws: WebSocket | null = null
  private url: string
  private opts: Required<WebSocketSignalOptions>
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null

  constructor(url: string, options: WebSocketSignalOptions = {}) {
    const channels = options.channels ?? 8
    super(channels)
    this.url = url
    this.opts = {
      parse: options.parse ?? defaultParse,
      reconnect: options.reconnect ?? true,
      reconnectDelay: options.reconnectDelay ?? 2000,
      channels,
    }
  }

  connect(): void {
    if (this._active) return
    this._active = true
    this.open()
  }

  disconnect(): void {
    this._active = false
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
    if (this.ws) {
      this.ws.onclose = null // prevent reconnect
      this.ws.close()
      this.ws = null
    }
  }

  private open(): void {
    this.ws = new WebSocket(this.url)

    this.ws.onmessage = (event) => {
      const values = this.opts.parse(event.data)
      const len = Math.min(values.length, this._data.length)
      for (let i = 0; i < len; i++) {
        this._data[i] = values[i]
      }
      this.emit()
    }

    this.ws.onclose = () => {
      if (this._active && this.opts.reconnect) {
        this.reconnectTimer = setTimeout(() => this.open(), this.opts.reconnectDelay)
      }
    }

    this.ws.onerror = () => {
      this.ws?.close()
    }
  }
}

function defaultParse(data: MessageEvent['data']): number[] {
  try {
    const parsed = JSON.parse(data as string)
    return Array.isArray(parsed) ? parsed : Object.values(parsed)
  } catch {
    return []
  }
}
