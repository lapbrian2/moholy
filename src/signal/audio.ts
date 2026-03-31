import { BaseSignal } from './base'

export interface AudioSignalOptions {
  /** FFT size (power of 2, default: 256) */
  fftSize?: number
  /** Use microphone input (default: true). Pass AudioNode for custom source. */
  source?: 'mic' | AudioNode
  /** Smoothing time constant for FFT (0-1, default: 0.8) */
  smoothing?: number
}

export class AudioSignal extends BaseSignal {
  private ctx: AudioContext | null = null
  private analyser: AnalyserNode | null = null
  private sourceNode: MediaStreamAudioSourceNode | AudioNode | null = null
  private freqData: Uint8Array<ArrayBuffer> | null = null
  private opts: Required<AudioSignalOptions>

  constructor(options: AudioSignalOptions = {}) {
    const fftSize = options.fftSize ?? 256
    super(fftSize / 2) // frequency bins = fftSize / 2
    this.opts = {
      fftSize,
      source: options.source ?? 'mic',
      smoothing: options.smoothing ?? 0.8,
    }
  }

  async connect(): Promise<void> {
    if (this._active) return

    this.ctx = new AudioContext()
    this.analyser = this.ctx.createAnalyser()
    this.analyser.fftSize = this.opts.fftSize
    this.analyser.smoothingTimeConstant = this.opts.smoothing
    this.freqData = new Uint8Array(this.analyser.frequencyBinCount) as Uint8Array<ArrayBuffer>

    if (this.opts.source === 'mic') {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      this.sourceNode = this.ctx.createMediaStreamSource(stream)
      this.sourceNode.connect(this.analyser)
    } else {
      this.opts.source.connect(this.analyser)
      this.sourceNode = this.opts.source
    }

    this._active = true
  }

  disconnect(): void {
    if (!this._active) return
    this.sourceNode?.disconnect()
    this.analyser?.disconnect()
    if (this.ctx?.state !== 'closed') {
      this.ctx?.close()
    }
    this.ctx = null
    this.analyser = null
    this.sourceNode = null
    this.freqData = null
    this._active = false
  }

  update(_dt: number): void {
    if (!this._active || !this.analyser || !this.freqData) return
    this.analyser.getByteFrequencyData(this.freqData)

    // Normalize 0-255 → 0-1
    for (let i = 0; i < this.freqData.length; i++) {
      this._data[i] = this.freqData[i] / 255
    }
    this.emit()
  }
}
