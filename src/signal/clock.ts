import { BaseSignal } from './base'

/**
 * Time-based signal source with built-in oscillators.
 * Channels:
 *   [0] elapsed (seconds, normalized by period)
 *   [1] delta (frame delta in seconds)
 *   [2] sin oscillator (0-1)
 *   [3] cos oscillator (0-1)
 *   [4] sawtooth (0-1, resets each period)
 *   [5] square (0 or 1, flips each half-period)
 */
export interface ClockSignalOptions {
  /** Oscillator period in seconds (default: 2) */
  period?: number
}

export class ClockSignal extends BaseSignal {
  private elapsed = 0
  private period: number

  constructor(options: ClockSignalOptions = {}) {
    super(6)
    this.period = options.period ?? 2
  }

  connect(): void {
    this._active = true
    this.elapsed = 0
  }

  disconnect(): void {
    this._active = false
    this.elapsed = 0
  }

  update(dt: number): void {
    if (!this._active) return
    this.elapsed += dt

    const phase = (this.elapsed % this.period) / this.period // 0-1 sawtooth
    const angle = phase * Math.PI * 2

    this._data[0] = phase                          // normalized elapsed
    this._data[1] = Math.min(dt, 0.1)              // delta (capped)
    this._data[2] = (Math.sin(angle) + 1) * 0.5    // sin 0-1
    this._data[3] = (Math.cos(angle) + 1) * 0.5    // cos 0-1
    this._data[4] = phase                           // sawtooth 0-1
    this._data[5] = phase < 0.5 ? 1 : 0             // square

    this.emit()
  }
}
