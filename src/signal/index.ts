import { AudioSignal, type AudioSignalOptions } from './audio'
import { WebSocketSignal, type WebSocketSignalOptions } from './websocket'
import { FetchSignal, type FetchSignalOptions } from './fetch'
import { ArraySignal } from './array'
import { DeviceSignal, type DeviceSignalOptions } from './device'
import { ClockSignal, type ClockSignalOptions } from './clock'

export type { Signal, SignalOptions } from './base'
export { BaseSignal } from './base'
export { AudioSignal, WebSocketSignal, FetchSignal, ArraySignal, DeviceSignal, ClockSignal }

/**
 * Signal factory — convenience constructors for all signal sources.
 */
export const signal = {
  /** Web Audio API FFT frequency data */
  audio: (options?: AudioSignalOptions) => new AudioSignal(options),

  /** WebSocket real-time stream */
  websocket: (url: string, options?: WebSocketSignalOptions) => new WebSocketSignal(url, options),

  /** HTTP polling at interval */
  fetch: (url: string, options?: FetchSignalOptions) => new FetchSignal(url, options),

  /** Static or manually updated array */
  array: (data: number[] | Float32Array) => new ArraySignal(data),

  /** Device orientation + accelerometer */
  device: (options?: DeviceSignalOptions) => new DeviceSignal(options),

  /** Time-based oscillators */
  clock: (options?: ClockSignalOptions) => new ClockSignal(options),
}
