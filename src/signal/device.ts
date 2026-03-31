import { BaseSignal } from './base'

export interface DeviceSignalOptions {
  /** Include orientation data: alpha, beta, gamma (default: true) */
  orientation?: boolean
  /** Include motion data: x, y, z acceleration (default: false) */
  motion?: boolean
}

/**
 * Device sensors: gyroscope orientation and accelerometer motion.
 * Channels layout:
 *   [0] alpha (compass, 0-360 → 0-1)
 *   [1] beta  (front-back tilt, -180 to 180 → 0-1)
 *   [2] gamma (left-right tilt, -90 to 90 → 0-1)
 *   [3] accelX (-10 to 10 → 0-1)
 *   [4] accelY
 *   [5] accelZ
 */
export class DeviceSignal extends BaseSignal {
  private opts: Required<DeviceSignalOptions>
  private orientHandler: ((e: DeviceOrientationEvent) => void) | null = null
  private motionHandler: ((e: DeviceMotionEvent) => void) | null = null

  constructor(options: DeviceSignalOptions = {}) {
    super(6)
    this.opts = {
      orientation: options.orientation ?? true,
      motion: options.motion ?? false,
    }
  }

  async connect(): Promise<void> {
    if (this._active) return

    // iOS 13+ permission
    if (typeof (DeviceMotionEvent as unknown as { requestPermission?: () => Promise<string> })
      .requestPermission === 'function') {
      const perm = await (DeviceMotionEvent as unknown as { requestPermission: () => Promise<string> })
        .requestPermission()
      if (perm !== 'granted') return
    }

    if (this.opts.orientation) {
      this.orientHandler = (e: DeviceOrientationEvent) => {
        this._data[0] = (e.alpha ?? 0) / 360
        this._data[1] = ((e.beta ?? 0) + 180) / 360
        this._data[2] = ((e.gamma ?? 0) + 90) / 180
        this.emit()
      }
      window.addEventListener('deviceorientation', this.orientHandler)
    }

    if (this.opts.motion) {
      this.motionHandler = (e: DeviceMotionEvent) => {
        const a = e.accelerationIncludingGravity
        if (a) {
          this._data[3] = ((a.x ?? 0) + 10) / 20
          this._data[4] = ((a.y ?? 0) + 10) / 20
          this._data[5] = ((a.z ?? 0) + 10) / 20
        }
        this.emit()
      }
      window.addEventListener('devicemotion', this.motionHandler)
    }

    this._active = true
  }

  disconnect(): void {
    if (this.orientHandler) {
      window.removeEventListener('deviceorientation', this.orientHandler)
      this.orientHandler = null
    }
    if (this.motionHandler) {
      window.removeEventListener('devicemotion', this.motionHandler)
      this.motionHandler = null
    }
    this._active = false
  }
}
