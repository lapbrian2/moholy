import type { Signal } from '../signal/base'
import type { CurveType } from './transforms'
import type { PaletteName, RGB } from './palettes'
import { smooth, threshold, remap, clamp01, invert, applyCurve } from './transforms'
import { samplePalette, generatePaletteTexture } from './palettes'

/**
 * Encoding configuration — maps signal channels to visual dimensions.
 */
export interface EncodingConfig {
  color?: ChannelEncoding & { palette?: PaletteName | string[] }
  displacement?: ChannelEncoding
  opacity?: ChannelEncoding
  speed?: ChannelEncoding
  scale?: ChannelEncoding
  emission?: ChannelEncoding
}

export interface ChannelEncoding {
  /** Signal channel index to read from */
  channel: number
  /** Output range [min, max] (default: [0, 1]) */
  range?: [number, number]
  /** Smoothing factor 0-1 (0 = no smoothing, 1 = max lag) */
  smooth?: number
  /** Values below this become 0 */
  threshold?: number
  /** Invert the value (1 - v) */
  invert?: boolean
  /** Easing curve */
  curve?: CurveType
}

export interface EncodedOutput {
  /** Current encoded values as plain numbers */
  uniforms: {
    color: RGB
    displacement: number
    opacity: number
    speed: number
    scale: number
    emission: number
  }
  /** Raw channel values (pre-encoding, post-smoothing) */
  raw: Record<string, number>
  /** Palette texture data (Float32Array, width x 1 RGBA) — create DataTexture from this */
  paletteData: Float32Array | null
  /** Update all encodings from current signal state. Call each frame. */
  update(dt: number): void
  /** Disconnect signal and clean up */
  dispose(): void
}

/**
 * Create an encoded output from a signal + encoding config.
 */
export function encode(sig: Signal, config: EncodingConfig): EncodedOutput {
  const smoothed: Record<string, number> = {}
  const previous: Record<string, number> = {}

  // Initialize smoothed values
  for (const key of Object.keys(config)) {
    smoothed[key] = 0
    previous[key] = 0
  }

  const paletteData = config.color?.palette
    ? generatePaletteTexture(config.color.palette)
    : null

  const output: EncodedOutput = {
    uniforms: {
      color: { r: 0, g: 0, b: 0 },
      displacement: 0,
      opacity: 1,
      speed: 0,
      scale: 1,
      emission: 0,
    },
    raw: { ...smoothed },
    paletteData,

    update(dt: number) {
      sig.update(dt)

      for (const [key, enc] of Object.entries(config) as [keyof EncodingConfig, ChannelEncoding & { palette?: PaletteName | string[] }][]) {
        if (!enc) continue

        // Read raw value from signal
        let value = sig.data[enc.channel] ?? 0
        value = clamp01(value)

        // Apply threshold
        if (enc.threshold !== undefined) {
          value = threshold(value, enc.threshold)
        }

        // Apply smoothing
        if (enc.smooth !== undefined && enc.smooth > 0) {
          smoothed[key] = smooth(smoothed[key], value, enc.smooth)
          value = smoothed[key]
        } else {
          smoothed[key] = value
        }

        // Apply curve
        if (enc.curve) {
          value = applyCurve(value, enc.curve)
        }

        // Apply invert
        if (enc.invert) {
          value = invert(value)
        }

        // Store raw (post-processing, pre-remap)
        output.raw[key] = value

        // Apply range remap
        const [min, max] = enc.range ?? [0, 1]
        const remapped = remap(value, min, max)

        // Write to uniforms
        if (key === 'color') {
          const palette = (enc as { palette?: PaletteName | string[] }).palette ?? 'thermal'
          output.uniforms.color = samplePalette(palette, value)
        } else {
          output.uniforms[key] = remapped
        }

        previous[key] = value
      }
    },

    dispose() {
      sig.disconnect()
    },
  }

  return output
}
