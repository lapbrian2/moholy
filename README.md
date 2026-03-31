# moholy.js

Tiny WebGL library that maps real-time data signals to shader visual parameters.

Any data stream — audio, WebSocket, sensors, APIs, time — becomes color, displacement, opacity, glow on the GPU. Zero dependencies. Works with Three.js, raw WebGL, or any renderer that accepts uniforms.

Named after [Laszlo Moholy-Nagy](https://en.wikipedia.org/wiki/L%C3%A1szl%C3%B3_Moholy-Nagy), who built the Light-Space Modulator (1930) — a machine that turned light signals into visual art.

## Install

```bash
npm install moholy
```

Or via CDN:

```html
<script src="https://unpkg.com/moholy/dist/moholy.umd.js"></script>
```

## Quick Start

```js
import { signal, encode } from 'moholy'

// Create a signal source
const audio = signal.audio({ fftSize: 256 })

// Map signal channels to visual parameters
const vis = encode(audio, {
  color:        { channel: 0, palette: 'thermal', smooth: 0.1 },
  displacement: { channel: 8, range: [-0.5, 0.5] },
  emission:     { channel: 2, range: [0.0, 2.0], smooth: 0.2 },
})

// Connect and use in your render loop
await audio.connect()

function animate() {
  vis.update(0.016)
  // vis.uniforms.color       → { r, g, b }
  // vis.uniforms.displacement → number
  // vis.uniforms.emission     → number
  requestAnimationFrame(animate)
}
animate()
```

## Signal Sources

| Source | Constructor | Data |
|--------|-----------|------|
| Audio | `signal.audio({ fftSize })` | FFT frequency bins |
| WebSocket | `signal.websocket(url, { parse })` | Real-time stream |
| Fetch | `signal.fetch(url, { interval })` | HTTP polling |
| Array | `signal.array([...values])` | Static / manual |
| Device | `signal.device({ orientation, motion })` | Gyro + accelerometer |
| Clock | `signal.clock({ period })` | Time oscillators |

Every signal has the same interface: `.data` (Float32Array), `.connect()`, `.disconnect()`, `.update(dt)`.

## Encodings

Map signal channels to visual dimensions:

```js
encode(signal, {
  color:        { channel, range?, palette?, smooth? },
  displacement: { channel, range?, smooth?, curve? },
  opacity:      { channel, range?, threshold?, invert? },
  speed:        { channel, range? },
  scale:        { channel, range? },
  emission:     { channel, range?, smooth? },
})
```

### Transforms

- `smooth` — exponential moving average (0 = none, 1 = max lag)
- `threshold` — hard cutoff, values below become 0
- `invert` — flip the value (1 - v)
- `curve` — `'linear'` | `'ease-in'` | `'ease-out'` | `'ease-in-out'`

### Palettes

Built-in: `'thermal'` `'ocean'` `'neon'` `'monochrome'` `'spectral'`

Custom: pass an array of hex strings.

```js
{ channel: 0, palette: ['#000000', '#ff0066', '#00ffcc', '#ffffff'] }
```

## GLSL Chunks

Optional shader functions you can include in your GLSL:

```js
import { glsl } from 'moholy'

// glsl.color     — palette sampling
// glsl.displace  — vertex displacement helpers
// glsl.emission  — emissive glow functions
// glsl.noise     — 2D/3D value noise + FBM
```

Inject into your shader via string concatenation:

```js
const fragmentShader = glsl.noise + glsl.color + `
  void main() {
    float n = moholyNoise2D(vUv * 10.0);
    vec3 col = moholyColor(n, uPalette);
    gl_FragColor = vec4(col, 1.0);
  }
`
```

## With Three.js

```js
import * as THREE from 'three'
import { signal, encode } from 'moholy'

const clock = signal.clock({ period: 4 })
const vis = encode(clock, {
  color:        { channel: 2, palette: 'spectral' },
  displacement: { channel: 3, range: [-0.3, 0.3] },
})
clock.connect()

const material = new THREE.MeshStandardMaterial()

function animate() {
  vis.update(0.016)
  const { color, displacement } = vis.uniforms
  material.color.setRGB(color.r, color.g, color.b)
  material.displacementScale = displacement
  requestAnimationFrame(animate)
}
```

## Playground

Interactive playground at [moholy.vercel.app](https://moholy.vercel.app) — edit signal + encoding config, see shader output live.

Run locally:

```bash
npm run dev
```

## API Reference

### `signal.audio(options?)`

Creates a Web Audio API FFT signal. Options: `fftSize` (default 256), `smoothing` (default 0.8), `source` ('mic' or AudioNode).

### `signal.websocket(url, options?)`

WebSocket signal with auto-reconnect. Options: `parse` (message parser), `reconnect` (default true), `channels` (default 8).

### `signal.fetch(url, options?)`

HTTP polling signal. Options: `interval` (ms, default 5000), `parse` (response parser), `channels` (default 8).

### `signal.array(data)`

Static or manually updated signal. Call `.set(data)` or `.setChannel(index, value)` to update.

### `signal.device(options?)`

Device sensor signal. Channels: alpha (0), beta (1), gamma (2), accelX (3), accelY (4), accelZ (5). Options: `orientation` (default true), `motion` (default false).

### `signal.clock(options?)`

Time-based oscillators. Channels: elapsed (0), delta (1), sin (2), cos (3), sawtooth (4), square (5). Options: `period` (seconds, default 2).

### `encode(signal, config)`

Creates an encoded output. Call `.update(dt)` each frame. Read `.uniforms` for current values. Call `.dispose()` to clean up.

## License

MIT
