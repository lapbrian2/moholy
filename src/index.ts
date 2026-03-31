/**
 * moholy.js — Tiny WebGL library that maps real-time data signals
 * to shader visual parameters.
 *
 * Named after Laszlo Moholy-Nagy, who built the Light-Space Modulator (1930) —
 * a machine that turned light signals into visual art.
 *
 * @example
 * ```ts
 * import { signal, encode } from 'moholy'
 *
 * const audio = signal.audio({ fftSize: 256 })
 * const vis = encode(audio, {
 *   color: { channel: 0, range: [0, 1], palette: 'thermal' },
 *   displacement: { channel: 1, range: [-0.5, 0.5], smooth: 0.1 },
 * })
 *
 * audio.connect()
 *
 * function animate(time) {
 *   vis.update(0.016)
 *   material.uniforms.uColor.value.set(vis.uniforms.color.r, vis.uniforms.color.g, vis.uniforms.color.b)
 *   material.uniforms.uDisplacement.value = vis.uniforms.displacement
 *   requestAnimationFrame(animate)
 * }
 * ```
 */

// Signals
export { signal } from './signal'
export type { Signal, SignalOptions } from './signal'
export { AudioSignal, WebSocketSignal, FetchSignal, ArraySignal, DeviceSignal, ClockSignal } from './signal'

// Encoding
export { encode } from './encode'
export type { EncodingConfig, ChannelEncoding, EncodedOutput } from './encode'
export { samplePalette, generatePaletteTexture, PALETTES } from './encode'
export type { PaletteName, RGB, CurveType } from './encode'
export { smooth, threshold, remap, clamp01, invert, derivative, applyCurve } from './encode'

// GLSL chunks
export { glsl } from './glsl'
