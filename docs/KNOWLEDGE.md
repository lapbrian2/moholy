# moholy.js — Comprehensive Knowledge Base

> A tiny WebGL library that maps real-time data signals to shader visual parameters.
> Research compiled March 2026.

---

## Table of Contents

- [1. Theoretical Foundation](#1-theoretical-foundation)
  - [1.1 Visual Encoding Theory (Bertin, Mackinlay, Munzner)](#11-visual-encoding-theory)
  - [1.2 Perceptual Color Science](#12-perceptual-color-science)
  - [1.3 D3 Scales as Architectural Model](#13-d3-scales-as-architectural-model)
  - [1.4 MilkDrop as Precedent](#14-milkdrop-as-precedent)
  - [1.5 Moholy-Nagy Art Historical Context](#15-moholy-nagy-art-historical-context)
  - [1.6 Smoothing and Interpolation](#16-smoothing-and-interpolation)
  - [1.7 Design Principles Synthesized](#17-design-principles-synthesized)
- [2. Signal Processing](#2-signal-processing)
  - [2.1 Web Audio API Deep Dive](#21-web-audio-api-deep-dive)
  - [2.2 Frequency Band Mapping](#22-frequency-band-mapping)
  - [2.3 Beat Detection / Onset Detection](#23-beat-detection--onset-detection)
  - [2.4 Signal Math (EMA, Kalman, Normalization)](#24-signal-math)
  - [2.5 Device Sensors](#25-device-sensors)
  - [2.6 WebSocket Streaming Patterns](#26-websocket-streaming-patterns)
  - [2.7 Timing and Synchronization](#27-timing-and-synchronization)
  - [2.8 Audio-Reactive Visual Patterns](#28-audio-reactive-visual-patterns)
- [3. WebGL and Shader Best Practices](#3-webgl-and-shader-best-practices)
  - [3.1 Uniform Management](#31-uniform-management)
  - [3.2 DataTexture Patterns](#32-datatexture-patterns)
  - [3.3 WebGL2 Features for Signal Streaming](#33-webgl2-features-for-signal-streaming)
  - [3.4 GPU Memory Management](#34-gpu-memory-management)
  - [3.5 Precision (mediump vs highp)](#35-precision)
  - [3.6 Performance Anti-Patterns](#36-performance-anti-patterns)
  - [3.7 Real-Time Uniform Streaming Architecture](#37-real-time-uniform-streaming-architecture)
- [4. GLSL Techniques](#4-glsl-techniques)
  - [4.1 Noise Functions](#41-noise-functions)
  - [4.2 FBM Variants](#42-fbm-variants)
  - [4.3 Domain Warping](#43-domain-warping)
  - [4.4 SDFs and Smooth Booleans](#44-sdfs-and-smooth-booleans)
  - [4.5 Color Science in GLSL](#45-color-science-in-glsl)
  - [4.6 Displacement and Normal Recalculation](#46-displacement-and-normal-recalculation)
  - [4.7 Post-Processing Effects](#47-post-processing-effects)
  - [4.8 GPU Particles and Flow Fields](#48-gpu-particles-and-flow-fields)
  - [4.9 Reaction-Diffusion](#49-reaction-diffusion)
- [5. Creative Coding Library Landscape](#5-creative-coding-library-landscape)
  - [5.1 Library Analysis](#51-library-analysis)
  - [5.2 Cross-Cutting Design Lessons](#52-cross-cutting-design-lessons)
  - [5.3 Competitive Positioning Matrix](#53-competitive-positioning-matrix)
- [6. Three.js Integration](#6-threejs-integration)
  - [6.1 Uniform Patterns and onBeforeCompile](#61-uniform-patterns-and-onbeforecompile)
  - [6.2 DataTexture for GPU Data](#62-datatexture-for-gpu-data)
  - [6.3 R3F Hooks](#63-r3f-hooks)
  - [6.4 drei Utilities](#64-drei-utilities)
  - [6.5 CSM Integration](#65-csm-integration)
  - [6.6 Post-Processing Effect Class](#66-post-processing-effect-class)
  - [6.7 Performance Patterns](#67-performance-patterns)
- [7. Interactive Documentation Design](#7-interactive-documentation-design)
  - [7.1 Site Analysis](#71-site-analysis)
  - [7.2 Meta-Patterns](#72-meta-patterns)
  - [7.3 Design Recommendations for moholy.js](#73-design-recommendations)
- [8. UI/UX Patterns for Creative Tools](#8-uiux-patterns-for-creative-tools)
  - [8.1 Code Playground Patterns](#81-code-playground-patterns)
  - [8.2 Parameter Control Interfaces](#82-parameter-control-interfaces)
  - [8.3 Signal Visualization](#83-signal-visualization)
  - [8.4 Dark Theme Design](#84-dark-theme-design)
  - [8.5 Typography](#85-typography)
  - [8.6 Responsive Patterns](#86-responsive-patterns)
  - [8.7 Interaction Micro-Patterns](#87-interaction-micro-patterns)

---

## 1. Theoretical Foundation

### 1.1 Visual Encoding Theory

#### Bertin's Visual Variables (1967)

Jacques Bertin's *Semiologie graphique* established seven visual variables: **position, size, shape, value (lightness), color (hue), orientation, and texture**.

Each variable has perceptual properties:
- **Selective**: Can you immediately isolate a group?
- **Ordered**: Does the variable convey magnitude? (Only position, size, value, and texture)
- **Quantitative**: Can you read exact ratios? (Only position and size)

**Constraint for moholy.js:** Not all visual parameters are equally good at encoding all data types. Mapping frequency amplitude to color hue will never communicate magnitude as accurately as mapping it to position or size.

#### Mackinlay's Effectiveness Rankings (1986)

**Quantitative data** (most to least effective): Position > Length > Angle > Slope > Area > Volume > Density/Value > Color Saturation > Color Hue

**Ordinal data**: Position > Density/Value > Color Saturation > Color Hue > Texture > Connection > Containment > Length > Angle > Slope

**Nominal/Categorical data**: Position > Color Hue > Texture > Connection > Containment > Density > Color Saturation > Shape

**Key insight:** Color hue is excellent for categorical distinction but terrible for quantitative encoding. Displacement/position is universally the most effective channel.

#### Munzner's Marks and Channels (2014)

Five evaluation criteria: **Accuracy, Discriminability, Separability, Popout, Grouping**.

For ordered/quantitative attributes: Aligned spatial position > Unaligned spatial position > Length > Angle > Area > Depth > Luminance = Saturation > Curvature = Volume.

For categorical attributes: Spatial region > Color hue > Motion > Shape.

**Implication:** The most important data dimension should map to the most effective visual channel. A "preset" is a mapping configuration -- which data dimension goes to which visual channel, with what scaling function.

**Sources:** [Semiology of Graphics](https://nicolas.kruchten.com/semiology_of_graphics/), [Visual Variables - Axis Maps](https://www.axismaps.com/guide/visual-variables), [Munzner - VAD Book](https://www.cs.ubc.ca/~tmm/vadbook/), [CSE 442 Visual Encoding](https://courses.cs.washington.edu/courses/cse442/17au/lectures/CSE442-VisualEncoding.pdf)

---

### 1.2 Perceptual Color Science

#### Why Rainbow Colormaps Fail

Rainbow/jet colormaps contain brightness reversals at yellow and red that create false contours and perceptual banding. Approximately 1 in 12 men have color-vision deficiencies that make rainbow palettes unreliable.

#### Perceptually Uniform Colormaps

Viridis, inferno, magma, and plasma achieve: monotonically increasing luminance (readable in grayscale), large perceptual range, and colorblind safety.

#### Oklab Color Space

Bjorn Ottosson's Oklab (2020) addresses CIELAB's hue non-linearity in the blue region. Key advantages:
- **Hue-stable interpolation**: Gradients through blue-violet stay vibrant
- **Efficient conversion from sRGB**: Two matrix multiplications + cube root -- feasible in real-time shaders
- **CSS Color Level 4 support**: `oklab()` and `oklch()` are now in browsers

**For moholy.js**: Color interpolation should happen in Oklab space, not sRGB. Linear interpolation in sRGB produces muddy, perceptually uneven gradients.

#### ColorBrewer Palettes

Three types mapping to data types:
- **Sequential**: Light-to-dark for ordered data (low to high)
- **Diverging**: Two hues diverging from a neutral midpoint
- **Qualitative**: Maximally distinct hues for categorical data

**Sources:** [Bottosson - Oklab](https://bottosson.github.io/posts/oklab/), [ColorBrewer](https://colorbrewer2.org/), [Domestic Engineering - Viridis vs Jet](https://www.domestic-engineering.com/drafts/viridis/viridis.html)

---

### 1.3 D3 Scales as Architectural Model

D3-scale provides the definitive implementation of data-to-visual-range mapping:

```
scale: domain (data space) --> range (visual space)
```

A scale is a function. The key insight: domain and range can be any type because D3 separates **normalization** (mapping domain to [0,1]) from **interpolation** (mapping [0,1] to range).

**Scale Types:**
- **Linear**: Proportional mapping
- **Log/Pow/Sqrt**: Non-linear for exponential distributions -- critical for audio (frequency is logarithmic, amplitude perceived logarithmically)
- **Band/Ordinal**: Discrete domain to continuous or discrete range
- **Sequential**: Two-element domain with interpolator as range -- ideal for colormaps
- **Diverging**: Three-element domain (min, midpoint, max) with interpolator

**Design principle:** A scale + a visual attribute = an encoding. Multiple encodings compose into a visualization. A "preset" is a collection of scales, each mapping a data dimension to a shader uniform.

**Sources:** [D3 Scale - Observable](https://d3js.org/d3-scale), [D3 in Depth - Scales](https://www.d3indepth.com/scales/), [GitHub - d3/d3-scale](https://github.com/d3/d3-scale)

---

### 1.4 MilkDrop as Precedent

Ryan Geiss's MilkDrop (2001) uses a two-level equation system:

**Per-frame equations**: Read audio data (bass, mid, treb, bass_att, mid_att, treb_att). Modify global parameters: zoom, rot, warp, wave properties, decay.

**Per-pixel equations**: Evaluated at each grid point, controlling UV coordinates for image feedback/warping.

**Two-shader pipeline** (MilkDrop 2): Warp shader (UV manipulation for feedback) + Composite shader (final output).

A MilkDrop preset is a **mapping specification**: how audio FFT data maps to visual parameters. Presets can interpolate smoothly between each other.

Audio exposure: `bass`, `mid`, `treb` (current frame) + `bass_att`, `mid_att`, `treb_att` (smoothed). The attenuated variants use exponential smoothing.

**Sources:** [MilkDrop Preset Authoring](https://www.geisswerks.com/milkdrop/milkdrop_preset_authoring.html), [MilkDrop - Wikipedia](https://en.wikipedia.org/wiki/MilkDrop)

---

### 1.5 Moholy-Nagy Art Historical Context

The *Light Prop for an Electric Stage* (Light-Space Modulator, 1922-1930) was built by Moholy-Nagy at the Bauhaus. It contains perforated metal discs and glass surfaces that revolve via electric motor, interacting with colored bulbs that flicker at pre-determined times. The spinning elements cast complex, shifting shadows and reflections.

**Key parallels to moholy.js:**
- The machine has **presets** (timing patterns of colored bulbs)
- Produces **real-time** output that evolves continuously
- Visual output is **ambient and immersive** -- not a chart to be read
- Light itself is the medium
- The machine **modulates** parameters of a visual experience

Moholy-Nagy's principle: **technology should serve perception** -- new tools create new ways of seeing. moholy.js continues this: shader technology serving the perception of data.

**Sources:** [Harvard Art Museums - Light Prop](https://harvardartmuseums.org/collections/object/299819), [SOCKS Studio](https://socks-studio.com/2014/01/18/light-prop-for-an-electric-stage-by-laszlo-moholy-nagy-1929-1930/)

---

### 1.6 Smoothing and Interpolation

#### Exponential Smoothing (Frame-Rate Independent)

```javascript
value = lerp(value, target, 1 - exp(-speed * dt))
```

Produces ease-out behavior. The `speed` parameter controls responsiveness.

#### Spring Physics (Critically Damped)

- **Underdamped** (ratio < 1): Oscillates -- bouncy, playful
- **Critically damped** (ratio = 1): Fastest approach without oscillation -- professional, smooth
- **Overdamped** (ratio > 1): Sluggish, no overshoot

Advantages over exponential: velocity continuity, S-curve (ease-in + ease-out), intuitive `halflife` parameter, inherently frame-rate independent.

**For moholy.js:** Different parameters should use different smoothing. Bass response: fast exponential. Ambient color: critically damped spring with long halflife. Bloom: underdamped springs.

**Sources:** [lisyarus - Exponential Smoothing](https://lisyarus.github.io/blog/posts/exponential-smoothing.html), [Spring-It-On](https://theorangeduck.com/page/spring-roll-call), [The Art of Damping](https://www.alexisbacot.com/blog/the-art-of-damping)

---

### 1.7 Design Principles Synthesized

1. **Scales are the core primitive.** A scale maps a data domain to a visual range. moholy.js is a collection of scales connecting data sources to shader uniforms.
2. **Effectiveness rankings guide default mappings.** Most important data to position/displacement, not just color.
3. **Color interpolation in Oklab space.** sRGB interpolation is perceptually broken.
4. **Presets are named points in mapping-configuration space.** Transitions interpolate through configuration space.
5. **Every parameter needs a smoothing strategy.** This separates jittery raw data from aesthetically pleasing visualization.
6. **Logarithmic scaling is the default for audio.** Both frequency and loudness are perceived logarithmically.
7. **Support both attenuated and raw data.** Following MilkDrop's `bass` vs `bass_att` pattern.
8. **Accessibility is non-negotiable.** ColorBrewer-safe palettes and Munzner's discriminability criteria built in.
9. **The output is ambient, not analytical.** Prioritize aesthetic coherence and temporal smoothness over precise data readability.
10. **Light is the medium.** The library modulates light (emission, bloom, color, luminance) in response to data.

---

## 2. Signal Processing

### 2.1 Web Audio API Deep Dive

#### AnalyserNode Core Architecture

Sits in the audio graph as a pass-through node (1 input, 1 output). Audio flows through unchanged while providing frequency and time-domain analysis via FFT.

```javascript
const ctx = new AudioContext();
const analyser = ctx.createAnalyser();
source.connect(analyser);
analyser.connect(ctx.destination); // optional
```

#### Key Properties

| Property | Default | Range | Notes |
|---|---|---|---|
| `fftSize` | 2048 | 32-32768 (power of 2) | Higher = more frequency resolution, less time resolution |
| `frequencyBinCount` | (read-only) | fftSize / 2 | Number of frequency data points returned |
| `smoothingTimeConstant` | 0.8 | 0.0-1.0 | Exponential time-averaging between frames |
| `minDecibels` | -100 | any double | Floor for byte scaling |
| `maxDecibels` | -30 | any double | Ceiling for byte scaling |

#### Frequency Bin-to-Hz Mapping

```
frequency(bin) = bin * (sampleRate / fftSize)
```

At `sampleRate=44100`, `fftSize=2048`: ~21.53 Hz per bin, 1024 bins total.

#### Data Output Comparison

| | `getFloatFrequencyData()` | `getByteFrequencyData()` |
|---|---|---|
| Output type | Float32Array | Uint8Array |
| Value range | dB (typically -100 to -30) | 0-255 |
| Use case | Signal processing, beat detection | Quick visualizations |

Byte scaling: `byteValue = 255 * (dBValue - minDecibels) / (maxDecibels - minDecibels)`, clamped to [0, 255].

#### smoothingTimeConstant Tuning

```
smoothedValue[i] = k * previousValue[i] + (1 - k) * currentValue[i]
```

- **k = 0-0.3**: Beat detection (responsive, jittery)
- **k = 0.5-0.8**: Waveform visualization (balanced)
- **k = 0.85-0.95**: Ambient mood (smooth, sluggish)

#### fftSize Tradeoffs

| fftSize | Bins | Hz/bin @44.1k | Latency | Use |
|---|---|---|---|---|
| 256 | 128 | 172 Hz | ~5.8ms | Fast transient detection |
| 512 | 256 | 86 Hz | ~11.6ms | Beat detection |
| 1024 | 512 | 43 Hz | ~23.2ms | Balanced |
| 2048 | 1024 | 21.5 Hz | ~46.4ms | Good frequency resolution |
| 4096 | 2048 | 10.7 Hz | ~92.9ms | Fine frequency analysis |

**Sources:** [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode), [MDN: fftSize](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode/fftSize)

---

### 2.2 Frequency Band Mapping

#### Standard Audio Frequency Bands

| Band | Range (Hz) | Character |
|---|---|---|
| **Sub-bass** | 20-60 | Felt more than heard -- sub kicks, rumble |
| **Bass** | 60-250 | Foundation -- kick drums, bass guitar |
| **Low-mid** | 250-500 | Body -- lower vocals, warmth |
| **Midrange** | 500-2000 | Core voice/instrument range |
| **Upper-mid** | 2000-4000 | Presence -- consonants, attack |
| **Presence** | 4000-6000 | Clarity -- vocal clarity, cymbal body |
| **Brilliance** | 6000-20000 | Air -- hi-hats, sibilance |

#### Bin-to-Band Mapping

```javascript
function getBinRange(lowHz, highHz, sampleRate, fftSize) {
  const binWidth = sampleRate / fftSize;
  return {
    start: Math.floor(lowHz / binWidth),
    end: Math.min(Math.ceil(highHz / binWidth), fftSize / 2 - 1)
  };
}

// sampleRate=44100, fftSize=2048:
// Sub-bass (20-60Hz):  bins 1-3
// Bass (60-250Hz):     bins 3-12
// Low-mid (250-500Hz): bins 12-23
// Midrange (500-2kHz): bins 23-93
// Brilliance (6k-20kHz): bins 279-930
```

#### Bark Scale (Perceptual)

24 critical bands. Approximately logarithmic above 500 Hz, linear below.

```javascript
function hzToBark(freq) {
  return 13 * Math.atan(0.00076 * freq) + 3.5 * Math.atan(Math.pow(freq / 7500, 2));
}
```

Mapping FFT data to ~24 Bark bands produces more perceptually uniform visual response than linear frequency mapping.

---

### 2.3 Beat Detection / Onset Detection

#### Energy-Based Beat Detection

1. Low-pass filter to isolate kick drums
2. Identify peaks above threshold (1.3x average energy)
3. Compute intervals between peaks
4. Group intervals by BPM
5. Pick most common BPM

Library: [web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector)

#### Spectral Flux Onset Detection

```javascript
function spectralFlux(currentSpectrum, previousSpectrum) {
  let flux = 0;
  for (let i = 0; i < currentSpectrum.length; i++) {
    const diff = currentSpectrum[i] - previousSpectrum[i];
    flux += Math.max(0, diff); // half-wave rectification
  }
  return flux;
}
```

Adaptive threshold: onset detected when flux exceeds `mean(recentFlux) * 1.5`.

Library: [Web-Onset](https://github.com/Keavon/Web-Onset)

**Sources:** [Beat Detection Using Web Audio](http://joesul.li/van/beat-detection-using-web-audio/)

---

### 2.4 Signal Math

#### Exponential Moving Average (EMA)

```javascript
class EMA {
  constructor(alpha = 0.1) { this.alpha = alpha; this.value = null; }
  update(newValue) {
    if (this.value === null) { this.value = newValue; }
    else { this.value = this.alpha * newValue + (1 - this.alpha) * this.value; }
    return this.value;
  }
}
```

Frame-rate independent: `alpha = 1 - Math.pow(1 - targetAlpha, dt / referenceDt)`

#### 1D Kalman Filter

```javascript
class SimpleKalman {
  constructor(R = 1, Q = 1) { this.R = R; this.Q = Q; this.x = 0; this.p = 1; }
  filter(measurement) {
    this.p += this.Q;
    const K = this.p / (this.p + this.R);
    this.x += K * (measurement - this.x);
    this.p *= (1 - K);
    return this.x;
  }
}
```

For audio-reactive: `R = 0.01` (trust FFT), `Q = 3` (expect rapid changes).

#### Normalization Strategies

| Strategy | Formula | When |
|---|---|---|
| Min-max | `(x - min) / (max - min)` | Known bounds, 0-1 mapping |
| Running min-max | Track over rolling window | Unknown bounds, adaptive |
| Z-score | `(x - mean) / stddev` | Outlier detection |
| Log scale | `Math.log(x + 1) / Math.log(maxVal + 1)` | Large dynamic range (audio) |

```javascript
class RunningNormalizer {
  constructor(decay = 0.995) { this.min = Infinity; this.max = -Infinity; this.decay = decay; }
  normalize(value) {
    this.min = Math.min(value, this.min + (value - this.min) * (1 - this.decay));
    this.max = Math.max(value, this.max - (this.max - value) * (1 - this.decay));
    const range = this.max - this.min;
    return range > 0.001 ? (value - this.min) / range : 0.5;
  }
}
```

**Sources:** [kalmanjs](https://github.com/wouterbulten/kalmanjs), [EMA Filters (mbedded.ninja)](https://blog.mbedded.ninja/programming/signal-processing/digital-filters/exponential-moving-average-ema-filter/)

---

### 2.5 Device Sensors

#### DeviceOrientationEvent

- `alpha`: Rotation around Z-axis (0-360, compass)
- `beta`: Front-back tilt (-180 to 180)
- `gamma`: Left-right tilt (-90 to 90)

#### iOS 13+ Permission Required

```javascript
async function requestSensorPermission() {
  if (typeof DeviceOrientationEvent.requestPermission === 'function') {
    const permission = await DeviceOrientationEvent.requestPermission();
    if (permission !== 'granted') throw new Error('Permission denied');
  }
}
// Must be called from a click handler
```

#### Complementary Filter (Sensor Fusion)

```javascript
const GYRO_WEIGHT = 0.98;
const ACCEL_WEIGHT = 0.02;
pitch = GYRO_WEIGHT * (pitch + gyroBeta * dt * Math.PI / 180) + ACCEL_WEIGHT * accelPitch;
```

---

### 2.6 WebSocket Streaming Patterns

#### Binary vs JSON

| | JSON | Binary (ArrayBuffer) |
|---|---|---|
| Overhead | String encoding + parsing | Minimal |
| Parse speed | ~1-5ms for large payloads | ~instant |
| Use case | Structured messages | High-frequency sensor data |

#### Reconnection with Exponential Backoff + Jitter

```javascript
const delay = Math.min(baseDelay * Math.pow(2, retries) + Math.random() * 1000, maxDelay);
```

#### Backpressure: Check `ws.bufferedAmount` before sending. Drop frames if > 64KB threshold.

---

### 2.7 Timing and Synchronization

```javascript
function animate(timestamp) {
  const dt = Math.min((timestamp - lastTime) / 1000, 0.1); // clamp max step
  lastTime = timestamp;
  position += velocity * dt; // ALWAYS multiply by dt
  requestAnimationFrame(animate);
}
```

**Key rules:**
- Always use `performance.now()` timestamp, never `Date.now()`
- Multiply all motion by `dt` for frame-rate independence
- Clamp `dt` to prevent physics explosions on tab refocus
- 144 Hz monitors have ~6.9ms dt vs 60 Hz at ~16.7ms

---

### 2.8 Audio-Reactive Visual Patterns

#### Signal Chain

1. **Input** -- Microphone, file, or stream
2. **Analysis** -- AnalyserNode FFT, split into bands
3. **Smoothing** -- EMA per band
4. **Normalization** -- Map to 0-1 with running min/max
5. **Mapping** -- Route bands to visual parameters
6. **Rendering** -- Shaders

#### Typical Mapping Table

| Audio Signal | Visual Parameter | Relationship |
|---|---|---|
| Sub-bass energy | Camera shake, screen distortion | Impulse (spiky) |
| Bass energy | Object scale, particle emission rate | Direct, smoothed |
| Midrange energy | Color hue shift, material roughness | Smooth |
| Treble energy | Particle speed, glow intensity | Fast-reacting |
| Overall RMS | Scene brightness, bloom | Smooth |
| Onset detection | Flash, particle burst, state change | Trigger (boolean) |
| Spectral centroid | Color temperature (warm/cool) | Continuous |

**Sources:** [Codrops: Audio-Reactive Particles](https://tympanus.net/codrops/2023/12/19/creating-audio-reactive-visuals-with-dynamic-particles-in-three-js/), [Airtight Interactive](https://www.airtightinteractive.com/2013/10/making-audio-reactive-visuals/)

---

## 3. WebGL and Shader Best Practices

### 3.1 Uniform Management

#### Cache uniform locations at init

```javascript
const locs = {
  uTime: gl.getUniformLocation(program, 'uTime'),
  uAmplitude: gl.getUniformLocation(program, 'uAmplitude'),
};
// render loop -- just set values
gl.uniform1f(locs.uTime, elapsed);
```

**Anti-pattern:** Looking up locations every frame. Each `getUniformLocation()` is a CPU-to-GPU round trip.

#### Uniform Buffer Objects (WebGL2)

```glsl
layout(std140) uniform SignalBlock {
  float uTime;
  float uBPM;
  float uAmplitude;
  float uFrequency;
  vec4  uChannels[8];
};
```

```javascript
const uboData = new Float32Array(36);
gl.bindBuffer(gl.UNIFORM_BUFFER, ubo);
gl.bufferSubData(gl.UNIFORM_BUFFER, 0, uboData);
```

UBOs can be shared across multiple shader programs. Global signal state lives in one UBO.

#### std140 Alignment Rules

- `float`: 4-byte aligned
- `vec2`: 8-byte aligned
- `vec3`/`vec4`: 16-byte aligned
- Arrays: each element padded to 16 bytes (`float[4]` takes 64 bytes, not 16)

**Sources:** [MDN WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices), [LearnOpenGL Advanced GLSL](https://learnopengl.com/Advanced-OpenGL/Advanced-GLSL)

---

### 3.2 DataTexture Patterns

#### When to Use What

| Data shape | Approach | Why |
|---|---|---|
| < 16 scalar values per frame | Individual uniforms or small UBO | Minimal overhead |
| 16-256 values, structured | UBO (WebGL2) | Single upload, shared |
| 256+ values, array-like (FFT, waveform) | DataTexture | GPU random-access via `texelFetch` |
| 2D grid data (heatmap, flow field) | DataTexture | Natural 2D addressing |

#### Float32 vs Uint8 vs Half-float

- **Float32 (RGBA32F)**: Full precision, required for HDR/audio. Use `gl.NEAREST` if linear filtering unavailable.
- **Uint8 (RGBA8)**: 4x smaller, faster upload, sufficient for normalized 0-1 data.
- **Half-float (RGBA16F)**: Good middle ground in WebGL2.

#### Upload Performance: texStorage + texSubImage

```javascript
// Init -- allocate immutable storage once
gl.texStorage2D(gl.TEXTURE_2D, 1, gl.RGBA32F, 512, 1);
// Per frame -- partial upload, no reallocation
gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, 512, 1, gl.RGBA, gl.FLOAT, fftData);
```

For 1D signal data (512 FFT bins), use a **512x1** texture, not 1x512. Row-major access has better cache locality.

#### Three.js DataTexture

- Set `texture.needsUpdate = true` every frame you modify the Float32Array
- Use RGBA (4-channel) even if you only need RGB (GPUs pad internally)
- Three.js lacks partial texture update -- drop to raw WebGL for sub-rectangle upload
- POT dimensions avoid internal resampling on some drivers

**Sources:** [Three.js DataTexture Issue #30184](https://github.com/mrdoob/three.js/issues/30184), [Don McCurdy: Texture Formats](https://www.donmccurdy.com/2024/02/11/web-texture-formats/)

---

### 3.3 WebGL2 Features for Signal Streaming

| Feature | Signal Relevance |
|---|---|
| **Uniform Buffer Objects** | Batch signal uniforms, share across programs |
| **Transform Feedback** | GPU-side particle/signal accumulation without readback |
| **Multiple Render Targets** (up to 8) | Deferred signal processing, multi-channel output |
| **Integer textures** (`R32I`, `RGBA8UI`) | Exact integer data (MIDI, event IDs) |
| **Float textures** (guaranteed) | Always available for HDR signal data |
| **3D textures** | Volumetric signal data, LUTs, time-series |
| **Texture arrays** (`TEXTURE_2D_ARRAY`) | Multiple signal streams in one bind |
| **`texelFetch`** | Integer-addressed texture reads -- perfect for data |
| **`texStorage`** | Immutable allocation + `texSubImage` for streaming |
| **Pixel Buffer Objects** | Async texture upload, zero-stall streaming |

**Recommendation:** Target WebGL2 only. 97%+ browser support. The features lost by supporting WebGL1 are precisely those needed for real-time data streaming.

#### Transform Feedback for Signal Accumulation

```javascript
gl.enable(gl.RASTERIZER_DISCARD); // skip fragment shader
gl.beginTransformFeedback(gl.POINTS);
gl.drawArrays(gl.POINTS, 0, signalCount);
gl.endTransformFeedback();
gl.disable(gl.RASTERIZER_DISCARD);
```

Use case: accumulating signal history, running IIR filters on GPU, particle physics driven by audio.

**Sources:** [WebGL2 What's New](https://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html), [GPU-Accelerated Particles](https://gpfault.net/posts/webgl2-particles.txt.html)

---

### 3.4 GPU Memory Management

**Three.js does not garbage collect GPU resources.** Call `.dispose()` explicitly.

```javascript
texture.dispose();
material.dispose();
geometry.dispose();
```

Monitor with `renderer.info.memory`.

#### Texture Memory Budget

- RGBA8: `width * height * 4` bytes
- RGBA32F: `width * height * 16` bytes
- With mipmaps: multiply by 1.33x
- 512x1 RGBA32F = 8 KB (trivial). 2048x2048 RGBA32F = 67 MB (significant).

**Sources:** [Three.js Memory Management Forum](https://discourse.threejs.org/t/webgl-memory-management-puzzlers/24583)

---

### 3.5 Precision

| Use case | Precision needed | Why |
|---|---|---|
| UV coordinates | `highp` | mediump has ~3 decimal digits, causes stepping |
| Noise functions | `highp` | Produces banding with mediump |
| Color output | `mediump` | 8-bit display, 16-bit enough |
| Time accumulator | `highp` | After ~4096s, mediump loses sub-second precision |
| Normalized 0-1 signals | `mediump` | Sufficient range |

```glsl
#ifdef GL_FRAGMENT_PRECISION_HIGH
  precision highp float;
#else
  precision mediump float;
#endif

uniform highp float uTime;        // accumulates -- needs highp
uniform mediump float uAmplitude; // normalized 0-1 -- mediump fine
uniform highp sampler2D uDataTex; // float data -- needs highp fetch
```

**Critical:** The `webgl-noise` library requires `highp`. Safari on iOS breaks with `mediump` noise.

**Sources:** [Chrome: Use mediump](https://developer.chrome.com/blog/use-mediump-precision-in-webgl-when-possible), [webgl-noise Safari Issue](https://github.com/ashima/webgl-noise/issues/25)

---

### 3.6 Performance Anti-Patterns

1. **Uniform location lookup every frame** -- cache at init
2. **Checking compile status after every shader** -- only check link status after linking fails
3. **Recompiling shaders at runtime** -- pre-compile variants with `#define` macros
4. **`texImage2D` for per-frame updates** -- use `texStorage2D` + `texSubImage2D`
5. **`gl.getError()` in production** -- flushes GPU pipeline
6. **Redundant state changes** -- cache GL state, skip redundant calls
7. **Not using `invalidateFramebuffer`** -- on mobile tile-based GPUs, forces depth writeback
8. **RGB textures** -- internally padded to RGBA on most drivers, always use RGBA

**Sources:** [WebGL Anti-Patterns](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html)

---

### 3.7 Real-Time Uniform Streaming Architecture

```
Signal Source (Audio/Sensor/Data)
        |
   [JS: Float32Array]        <-- CPU writes here
        |
  +-----+------+
  |             |
Small data    Large data
(< 64 vals)   (64+ vals)
  |             |
  UBO          DataTexture
  |             |
  bufferSubData texSubImage2D
  |             |
  +-----+------+
        |
   GPU reads in shader
```

#### Double-Buffered PBO Streaming (Zero-Stall)

```javascript
function streamFrame(signalData) {
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, currentPBO);
  gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, 1, gl.RGBA, gl.FLOAT, 0);
  gl.bindBuffer(gl.PIXEL_UNPACK_BUFFER, nextPBO);
  gl.bufferSubData(gl.PIXEL_UNPACK_BUFFER, 0, signalData);
  [currentPBO, nextPBO] = [nextPBO, currentPBO];
}
```

#### Frame Structure

```javascript
function render() {
  // Phase 1: Upload all signal data (before any draw calls)
  updateSignalUBO(signalState);
  updateFFTTexture(fftData);
  // Phase 2: Draw everything
  gl.useProgram(programA);
  gl.drawArrays(...);
}
```

**Sources:** [Khronos PBO Documentation](https://www.khronos.org/opengl/wiki/Pixel_Buffer_Object), [Emscripten Optimizing WebGL](https://emscripten.org/docs/optimizing/Optimizing-WebGL.html)

---

## 4. GLSL Techniques

### 4.1 Noise Functions

#### Value Noise

Hashes grid points to random values, interpolates. Cheapest but has visible grid artifacts.

```glsl
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float valueNoise(vec2 p) {
    vec2 i = floor(p); vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i+vec2(1,0)), u.x),
               mix(hash(i+vec2(0,1)), hash(i+vec2(1,1)), u.x), u.y);
}
```

#### Perlin Noise (Gradient Noise)

Random gradients at lattice points. Smoother, fewer grid artifacts. Quintic interpolant `6t^5 - 15t^4 + 10t^3` eliminates second-derivative discontinuities. ~2x value noise cost.

#### Simplex Noise

Ken Perlin's 2001 improvement. Uses simplex grid (triangles/tetrahedra). **O(n) complexity** vs O(2^n) for Perlin. No directional artifacts. Canonical: [ashima/webgl-noise](https://github.com/ashima/webgl-noise/wiki).

#### Worley Noise (Cellular/Voronoi)

Distance to nearest feature points. F1 = cell pattern. F2 - F1 = veins/cracks. Most expensive basic noise (3x3 neighbor loop).

#### Curl Noise

Not a noise type but an operator. Takes the curl of a potential field for **divergence-free vector fields** -- particles behave like incompressible fluid.

```glsl
vec2 curlNoise(vec2 p) {
    float eps = 0.001;
    float n1 = snoise(vec2(p.x, p.y + eps));
    float n2 = snoise(vec2(p.x, p.y - eps));
    float n3 = snoise(vec2(p.x + eps, p.y));
    float n4 = snoise(vec2(p.x - eps, p.y));
    return vec2((n1-n2)/(2.0*eps), -(n3-n4)/(2.0*eps));
}
```

4-6x single noise cost. Alternative: [Bitangent Noise](https://github.com/atyuwen/bitangent_noise) (cheaper).

---

### 4.2 FBM Variants

#### Standard FBM

```glsl
float fbm(vec2 p) {
    float value = 0.0, amplitude = 0.5, frequency = 1.0;
    for (int i = 0; i < OCTAVES; i++) {
        value += amplitude * snoise(p * frequency);
        frequency *= 2.0;   // lacunarity
        amplitude *= 0.5;   // gain (persistence)
    }
    return value;
}
```

4-8 octaves typical. Each doubles GPU cost. Rule: `gain = 1/lacunarity` for self-similar fractal.

#### Ridged FBM

`1.0 - abs(noise)`, squared. Creates sharp ridges (mountains, lightning, cracks).

#### Turbulence

`abs(noise)` without inversion. Creates cloud/smoke-like patterns.

---

### 4.3 Domain Warping

Feed noise output back into noise coordinates. Inigo Quilez's signature technique.

#### Basic: `f(p) = fbm(p + fbm(p))`

```glsl
float warpedPattern(vec2 p) {
    vec2 q = vec2(fbm(p + vec2(0.0,0.0)), fbm(p + vec2(5.2,1.3)));
    return fbm(p + 4.0 * q);
}
```

#### Double Domain Warp (Quilez)

```glsl
float pattern(vec2 p) {
    vec2 q = vec2(fbm(p + vec2(0.0,0.0)), fbm(p + vec2(5.2,1.3)));
    vec2 r = vec2(fbm(p + 4.0*q + vec2(1.7,9.2)), fbm(p + 4.0*q + vec2(8.3,2.8)));
    return fbm(p + 4.0 * r);
}
```

The multiplier `4.0` controls warp intensity. Animate with `u_time` in FBM coordinates.

**Performance:** Double warp = ~3x FBM cost. Pre-bake to texture if static.

---

### 4.4 SDFs and Smooth Booleans

#### 2D Primitives

```glsl
float sdCircle(vec2 p, float r) { return length(p) - r; }
float sdBox(vec2 p, vec2 b) {
    vec2 d = abs(p) - b;
    return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0);
}
```

#### Smooth Boolean (Quilez)

```glsl
float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
}
```

`k` controls blend radius. `k = 0` degenerates to hard boolean. Note: smooth operations distort the distance field.

#### SDF Raymarching

64-128 steps typical. Normal via central differences (6 scene evaluations).

**Sources:** [Inigo Quilez - Articles](https://iquilezles.org/articles/), [hg_sdf library](https://mercury.sexy/hg_sdf/)

---

### 4.5 Color Science in GLSL

#### Cosine Gradient Palettes (Quilez)

```glsl
vec3 palette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
    return a + b * cos(6.28318 * (c * t + d));
}
```

| Name | a | b | c | d |
|------|---|---|---|---|
| Rainbow | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (1.0,1.0,1.0) | (0.0,0.33,0.67) |
| Sunset | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (1.0,1.0,1.0) | (0.0,0.10,0.20) |
| Ice fire | (0.5,0.5,0.5) | (0.5,0.5,0.5) | (2.0,1.0,0.0) | (0.5,0.20,0.25) |

`cos()` is a native hardware instruction -- faster than any lookup table.

#### Oklab in GLSL

```glsl
vec3 rgb2oklab(vec3 c) {
    float l = 0.4122214708*c.r + 0.5363325363*c.g + 0.0514459929*c.b;
    float m = 0.2119034982*c.r + 0.6806995451*c.g + 0.1073969566*c.b;
    float s = 0.0883024619*c.r + 0.2817188376*c.g + 0.6299787005*c.b;
    l = pow(l, 1.0/3.0); m = pow(m, 1.0/3.0); s = pow(s, 1.0/3.0);
    return vec3(0.2104542553*l + 0.7936177850*m - 0.0040720468*s,
                1.9779984951*l - 2.4285922050*m + 0.4505937099*s,
                0.0259040371*l + 0.7827717662*m - 0.8086757660*s);
}

vec3 oklab2rgb(vec3 c) {
    float l = c.x + 0.3963377774*c.y + 0.2158037573*c.z;
    float m = c.x - 0.1055613458*c.y - 0.0638541728*c.z;
    float s = c.x - 0.0894841775*c.y - 1.2914855480*c.z;
    l = l*l*l; m = m*m*m; s = s*s*s;
    return vec3(4.0767416621*l - 3.3077115913*m + 0.2309699292*s,
               -1.2684380046*l + 2.6097574011*m - 0.3413193965*s,
               -0.0041960863*l - 0.7034186147*m + 1.7076147010*s);
}
```

**Sources:** [GLSL-Color-Functions](https://github.com/Rachmanin0xFF/GLSL-Color-Functions), [Inigo Quilez - Palettes](https://iquilezles.org/articles/palettes/)

---

### 4.6 Displacement and Normal Recalculation

**Method 1: Finite Difference** -- sample displacement at neighbor points along tangent/bitangent, cross product for normal. Epsilon controls detail level.

**Method 2: Analytical Derivatives** -- if noise gradient is known: `newNormal = normalize(normal - amplitude * grad)`

**Method 3: Fragment dFdx/dFdy** -- `normalize(cross(dFdx(worldPos), dFdy(worldPos)))` for flat-shaded normals.

**Sources:** [clicktorelease - Vertex Displacement](https://www.clicktorelease.com/blog/vertex-displacement-noise-3d-webgl-glsl-three-js/)

---

### 4.7 Post-Processing Effects

#### Bloom (Two-Pass)

Extract bright pixels (threshold), Gaussian blur (separable H+V passes), composite additively. Use progressive mip-chain downsampling for wider, cheaper bloom.

#### ACES Filmic Tone Mapping

```glsl
vec3 ACESFilm(vec3 x) {
    return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
}
```

#### Film Grain

```glsl
float grain(vec2 uv, float time) {
    return fract(sin(dot(uv + fract(time), vec2(12.9898, 78.233))) * 43758.5453);
}
```

#### Vignette

```glsl
float vignette(vec2 uv) {
    vec2 q = uv - 0.5;
    return 1.0 - dot(q, q) * strength;
}
```

**Performance:** Merge grain + vignette + tone mapping + color grading into a single pass.

---

### 4.8 GPU Particles and Flow Fields

#### Texture-Based GPU Particles (WebGL 1)

Store particle state in float textures (ping-pong FBOs). Each pixel = one particle.

#### Transform Feedback (WebGL 2)

More efficient: no texture read latency, better cache coherence, native vertex binding.

#### Curl Noise Flow Fields

Divergence-free flow for smoke/fluid. Layer multiple scales:

```glsl
vec2 flow = curlNoise(p * 0.5) * 1.0 + curlNoise(p * 2.0) * 0.3 + curlNoise(p * 8.0) * 0.05;
```

---

### 4.9 Reaction-Diffusion

Gray-Scott model. Two chemicals diffuse, react, create emergent patterns.

#### Pattern Map (f, k)

| Pattern | f | k |
|---------|---|---|
| Spots | 0.035 | 0.065 |
| Stripes | 0.025 | 0.060 |
| Spirals | 0.014 | 0.054 |
| Mitosis | 0.028 | 0.062 |
| Coral | 0.060 | 0.062 |

10-30 simulation steps per render frame. Laplacian = 9 texture reads/pixel/step.

**Sources:** [Reaction-Diffusion Playground](https://github.com/jasonwebb/reaction-diffusion-playground), [The Book of Shaders - Noise](https://thebookofshaders.com/11/), [Patricio's GLSL Noise Gist](https://gist.github.com/patriciogonzalezvivo/670c22f3966e662d2f83)

#### Performance Summary

| Technique | Relative Cost | Bottleneck |
|-----------|--------------|------------|
| Value Noise | 1x | ALU |
| Perlin Noise | 2x | ALU |
| Simplex Noise | 1.5-2x (2D) | ALU |
| Worley Noise | 4-6x | ALU + branching |
| FBM (6 octaves) | 6x base | ALU |
| Domain Warp (double) | 18x base | ALU |
| SDF Raymarching | 64-256 scene evals | ALU |
| Bloom (mip chain) | 5-6 passes | Bandwidth |
| Reaction-Diffusion | 9 tex reads x N steps | Bandwidth |

---

## 5. Creative Coding Library Landscape

### 5.1 Library Analysis

#### p5.js (p5.sound)

Named frequency bands ("bass", "lowMid", "mid", "highMid", "treble") are a brilliant abstraction. `getEnergy()` provides scalar extraction. Weakness: manual imperative mapping from data to visuals.

**Lesson:** Named bands are extremely ergonomic. The gap between "I have data" and "it's on screen" is what moholy should close.

#### ShaderToy

Fixed uniform set (`iTime`, `iResolution`, `iMouse`, `iChannel0-3`). Audio-as-texture: FFT data becomes a 512x2 texture. Multipass via buffer outputs.

**Lesson:** A small, fixed vocabulary of well-named inputs enables enormous creative range.

#### cables.gl

Node-based with typed ports (Trigger, Number, String, Array, Texture). Audio-to-texture pipeline built in.

**Lesson:** Separation of trigger (execution timing) from data (values) is powerful.

#### Hydra

Chainable function composition: `source().transform().out()`. Arrow functions as dynamic parameters: `osc(10, 0, () => a.fft[0]*4)`. 4 output buffers with feedback loops.

**Lesson:** Composition > configuration. The chaining syntax is the gold standard.

#### Theatre.js

`onValuesChange()` fires once per frame with all values. Typed props with ranges auto-generate UI. JSON-serializable state.

**Lesson:** Batch all parameter updates into a single per-frame callback.

#### Leva

`useControls({ param: value })` with type inference. Inline metadata (min, max, step).

**Lesson:** Type inference from initial values. Inline metadata keeps definition co-located with usage.

#### dat.gui / lil-gui

`gui.add(object, 'property')` -- point at an existing property. `glsl-auto-ui` parses GLSL for `ui`-prefixed uniforms and auto-generates controls.

**Lesson:** Auto-UI from shader uniform names is a powerful idea.

#### regl

Three-tier dynamics: `regl.prop('name')`, `regl.context('name')`, `(ctx, props, batchId) => value`. Context = per-frame globals, Props = per-object.

**Lesson:** Declarative placeholder for a value to be supplied later is the key primitive for deferred binding.

#### twgl.js

`setUniforms(programInfo, plainObject)` -- batch-set all uniforms from a plain JS object. Nested object support for struct arrays.

**Lesson:** The canonical "push all parameters to GPU" operation.

#### OGL

`{ value: x }` wrapper -- mutable container with stable identity. ~15KB.

**Lesson:** Stable identity, mutable value is how render-loop updates work without object recreation.

#### TouchDesigner

Six operator families: CHOP (1D signals), TOP (2D textures), SOP (3D geometry), DAT (data), MAT (materials), COMP (containers). Explicit conversion operators between families. Exports bind any signal to any parameter.

**Lesson:** Channel data (1D) and texture data (2D) are fundamentally different types that need different operations. Explicit conversion operators make the bridge visible.

---

### 5.2 Cross-Cutting Design Lessons

**1. The Universal Signal Pipeline:**

```
SOURCE -> PROCESS -> MAP -> RENDER
(audio, sensor, time) -> (FFT, smooth, scale) -> (to uniform, to texture) -> (shader, geometry)
```

No single library handles the full pipeline. moholy.js should own it.

**2. Three Binding Patterns:**
1. **Imperative update**: `uniform.value = data` (p5, OGL, Three.js)
2. **Declarative placeholder**: `regl.prop('color')`, `<Node uniforms={{color}}/>` (regl, gl-react)
3. **Reactive callback**: `onChange(value => applyToVisual(value))` (Theatre.js, Leva)

Default to declarative -- most composable.

**3. The Type Hierarchy:** Scalar -> Channel (1D array) -> Texture (2D array) -> Geometry (3D vertices). Each contains the previous.

**4. The Composition Primitive:** `modulate(target, source, amount)` -- use one signal to perturb another.

**5. The Metadata Convention:** `{ value, min, max, step, label, type }` -- constrains range AND auto-generates UI.

**6. The Auto-UI Pattern:** Three independent implementations prove this works (Leva, dat.gui, glsl-auto-ui).

---

### 5.3 Competitive Positioning Matrix

| Library | Source Input | Signal Processing | Visual Binding | Audio-Reactive | 3D | Auto-UI |
|---------|-------------|-------------------|----------------|----------------|-----|---------|
| p5.js | FFT, mic | Basic | Manual | Yes | No | No |
| ShaderToy | Textures, audio | Raw GLSL | Built-in | Via texture | No | No |
| cables.gl | Audio, video | Node ops | Port connections | Yes | Yes | Editor |
| Hydra | Mic FFT | Chain transforms | .out() | Yes (basic) | No | No |
| Theatre.js | Manual | Keyframes | onValuesChange | No | Via R3F | Studio |
| Leva | User input | None | useControls | No | Via R3F | Auto |
| regl | None | None | prop/context/fn | No | Yes | No |
| TouchDesigner | Everything | CHOP ops | Exports | Yes | Yes | Param UI |
| **moholy.js** | **Everything** | **Composable** | **Declarative** | **Yes** | **Yes** | **Auto** |

---

## 6. Three.js Integration

### 6.1 Uniform Patterns and onBeforeCompile

```javascript
const material = new THREE.ShaderMaterial({
  uniforms: {
    uTime:      { value: 0 },
    uColor:     { value: new THREE.Color(1, 0, 0) },
    uResolution:{ value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    uPalette:   { value: dataTexture },
  },
  vertexShader: `...`,
  fragmentShader: `...`,
})
```

**Defines vs Uniforms:**

| | Defines | Uniforms |
|---|---|---|
| When evaluated | Compile time | Every frame |
| Change cost | Full recompile | Zero |
| Use for | Feature flags, constants | Animated values |
| Gotcha | Must set `material.needsUpdate = true` | No needsUpdate needed |

**onBeforeCompile** for extending built-in materials:

```javascript
mat.onBeforeCompile = (shader) => {
  shader.uniforms.uWaveTime = { value: 0 }
  shader.vertexShader = shader.vertexShader.replace(
    '#include <begin_vertex>',
    `#include <begin_vertex>\n transformed.y += sin(transformed.x * 4.0 + uWaveTime) * 0.1;`
  )
  mat.userData.shader = shader
}
```

Gotcha: `onBeforeCompile` is not composable. CSM and troika solve this.

---

### 6.2 DataTexture for GPU Data

```javascript
const texture = new THREE.DataTexture(data, paletteSize, 1, THREE.RGBAFormat, THREE.FloatType);
texture.needsUpdate = true;
texture.minFilter = THREE.NearestFilter;
texture.magFilter = THREE.NearestFilter;
```

In GLSL: `float u = (index + 0.5) / paletteSize;` -- center of texel for exact lookup.

---

### 6.3 R3F Hooks

```tsx
useFrame((state, delta) => {
  materialRef.current.uniforms.uTime.value = state.clock.elapsedTime
})
```

**Rules:**
- **NEVER call setState inside useFrame** -- causes 60 re-renders/sec
- Mutate refs directly
- Priority ordering: lower values run first

```tsx
const size = useThree((state) => state.size) // selector avoids unnecessary re-renders
```

---

### 6.4 drei Utilities

**shaderMaterial helper:**

```tsx
const MoholyMaterial = shaderMaterial(
  { uTime: 0, uPalette: null, uIntensity: 1.0 },
  vertexShader, fragmentShader
)
extend({ MoholyMaterial })
// In JSX: <moholyMaterial uTime={elapsed} uIntensity={0.8} />
```

**useFBO** for render-to-texture. **MeshTransmissionMaterial** as reference pattern for full custom materials.

---

### 6.5 CSM Integration

```tsx
const mat = new CustomShaderMaterial({
  baseMaterial: THREE.MeshPhysicalMaterial,
  vertexShader: `void main() { csm_Position = position + normal * sin(uTime) * 0.1; }`,
  fragmentShader: `void main() { csm_DiffuseColor = vec4(1.0, 0.0, 0.0, 1.0); }`,
  uniforms: { uTime: { value: 0 } },
})
```

Output variables: `csm_Position`, `csm_Normal`, `csm_DiffuseColor`, `csm_FragColor`, `csm_Roughness`, `csm_Metalness`.

**Sources:** [CSM GitHub](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial), [drei shaderMaterial](https://drei.docs.pmnd.rs/shaders/shader-material)

---

### 6.6 Post-Processing Effect Class

```javascript
class MoholyEffect extends Effect {
  constructor({ intensity = 1.0, paletteTexture = null } = {}) {
    super('MoholyEffect', fragmentShader, {
      blendFunction: BlendFunction.Normal,
      uniforms: new Map([
        ['uIntensity', new Uniform(intensity)],
        ['uPaletteMap', new Uniform(paletteTexture)],
      ]),
    })
  }
  update(renderer, inputBuffer, deltaTime) {
    this.uniforms.get('uIntensity').value = this.someComputedValue
  }
}
```

Two shader functions: `mainImage(inputColor, uv, outputColor)` for color, `mainUv(inout uv)` for UV distortion.

---

### 6.7 Performance Patterns

| Do | Don't |
|-----|-------|
| Mutate refs directly in `useFrame` | Call `setState` in `useFrame` |
| `ref.current.uniforms.uTime.value = t` | Create new uniform objects per frame |
| Mutate Float32Array in-place, set `needsUpdate` | Create new DataTexture per frame |
| Use Zustand with `getState()` or transient subscribe | Use `useState` for per-frame values |
| `useThree(s => s.size)` with selector | Destructure everything from `useThree()` |
| `useMemo` for material/geometry creation | Recreate materials in render |
| `position.x += delta * speed` | `position.x += 0.01` (tied to 60fps) |

**Sources:** [R3F performance pitfalls](https://r3f.docs.pmnd.rs/advanced/pitfalls)

---

## 7. Interactive Documentation Design

### 7.1 Site Analysis

**10 sites analyzed:** heerich.js, Stripe Docs, Linear.app, Framer Motion, GSAP, Three.js Examples, Rough.js, D3 Observable, MDN, Svelte Tutorials.

**Key findings per site:**

- **heerich.js**: Single long-scroll, Roman numeral chapters, floating camera panel controls all demos. Global control surface pattern.
- **Stripe**: Three-panel layout (nav/prose/code). Personalized docs -- auto-injected API keys, language preference.
- **Linear**: Product as demo. Near-black backgrounds (#0A0A0B), subtle mesh gradients, glassmorphism.
- **Framer Motion**: Inline proof -- every API property has a live animation adjacent. 330+ examples.
- **GSAP**: Outsources playground to CodePen. Demo Hub for standalone demos.
- **Three.js**: Demo-first, code-second. Visual output is primary, source is secondary.
- **Rough.js**: The output IS the marketing. Hand-drawn aesthetic is instantly shareable.
- **D3 Observable**: Literate programming -- code, explanation, output interwoven with reactive dataflow.
- **MDN**: "Try it" panel at TOP of page, before reference details.
- **Svelte**: Split-screen guided tutorial. Left = instructions, right = live REPL.

---

### 7.2 Meta-Patterns

1. **The Output IS the Demo** (Rough.js): Every code example is a screenshot-worthy demo.
2. **Personalized Documentation** (Stripe): Docs adapt to the reader.
3. **Inline Proof** (Framer Motion): Never claim a feature without immediately demonstrating it.
4. **Product as Demo** (Linear): Embed the product experience.
5. **Time to First Value**: Fastest path from landing to "I can use this" wins.

**Code Playground Spectrum (lightest to heaviest):**

| Approach | Weight | Examples |
|----------|--------|----------|
| Static code block | Zero | Rough.js |
| Custom textarea | ~5KB | MDN "Try it" |
| Codapi embed | ~15KB | Blog posts |
| CodePen embed | ~100KB+ | GSAP docs |
| CodeMirror | ~150KB | Custom playgrounds |
| Monaco Editor | ~2MB+ | Heavy IDEs |

**For moholy.js:** CodeMirror or custom textarea.

---

### 7.3 Design Recommendations

**Layout:** Single long-scroll with chapter markers (heerich.js model). Persistent floating control panel. Section transitions via scroll-driven animations.

**Typography:**

| Role | Font | Weight |
|------|------|--------|
| Display/Chapter | Aboreto or geometric display | 400 |
| Body | Work Sans or Geist | 400 |
| Code | Geist Mono or SF Mono | 400 |
| Overlines | Geist, UPPERCASE | 500 |

**Color:** Dark background default. Near-black `#0A0A0B` or `#09090B`. Off-white text `#E4E4E7`. Single warm accent for links/markers.

**Interactive:** Global control surface + inline proof + code/output side-by-side + lightweight editable demos.

**Sources:** [Mintlify: Stripe Docs](https://www.mintlify.com/blog/stripe-docs), [Frontend Horse: The Linear Look](https://frontend.horse/articles/the-linear-look/), [GitHub: DDD](https://gist.github.com/zsup/9434452)

---

## 8. UI/UX Patterns for Creative Tools

### 8.1 Code Playground Patterns

**Split-pane:** Editor left (40-60%), preview right. Resize handle: 1px visual, 8px hit area. Min pane width: 200px.

**Editors:** CodeMirror 6 (~300KB, modular) for full GLSL editing. CodeJar (~2KB) for read-mostly snippets.

**Live Preview:** Auto-compile on keystroke with 300ms debounce. Status indicator: green = compiled, red = error, amber = compiling.

**Error Display:** Inline squiggles, collapsible error panel (80-120px), red gutter markers. Parse GLSL compile errors for line numbers.

---

### 8.2 Parameter Control Interfaces

**Panel:** Width 260-280px. Controls 28-32px tall. Label left (40%), input right (60%).

**Sliders:** 4px visible rail, 12-16px thumb. Click value label to switch to text input. Shift+drag for precision. Log scale for frequency ranges.

**Color Picker:** 24x24px swatch, expanding to 200x200px HSL picker. Format toggle HEX/RGB/HSL.

**Folder Organization:**
- "Signal" (frequency, amplitude, waveform type)
- "Color" (palette, mode, intensity)
- "Geometry" (shape, scale, rotation)
- "Rendering" (resolution, blend mode)

---

### 8.3 Signal Visualization

**Oscilloscope:** Fill width, 80-120px height. Grid `rgba(255,255,255,0.05)`. Waveform: 2px, accent color. Background: `#0a0a0a`.

**VU Meter:** Vertical bars. Gradient bottom-to-top: green `#22c55e` (0-70%), yellow `#eab308` (70-85%), red `#ef4444` (85-100%). Peak hold: 1.5s. Smoothing: `display = display * 0.9 + current * 0.1`.

**Spectrum:** 32-64 bars from FFT. Logarithmic frequency axis, linear amplitude. Height: 60-120px.

---

### 8.4 Dark Theme Design

#### moholy.js Recommended Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `--bg-deep` | `#0c0c0e` | Canvas background |
| `--bg-surface` | `#141416` | Editor background |
| `--bg-elevated` | `#1c1c20` | Panels, controls |
| `--bg-hover` | `#24242a` | Hover states |
| `--border` | `#2a2a32` | Dividers |
| `--border-active` | `#3a3a44` | Focus borders |
| `--text-primary` | `#e0e0e4` | Headings, labels |
| `--text-secondary` | `#8888a0` | Descriptions |
| `--text-muted` | `#55556a` | Placeholders |
| `--accent` | `#4a9eff` | Links, active states |
| `--accent-dim` | `#2a5a99` | Low-emphasis accent |
| `--signal-green` | `#00e676` | Waveform, success |
| `--signal-amber` | `#ffab00` | Warnings, peaks |
| `--signal-red` | `#ff1744` | Errors, clipping |

#### Contrast Ratios

| Pairing | Ratio | WCAG |
|---------|-------|------|
| `#e0e0e4` on `#141416` | ~14:1 | AAA |
| `#8888a0` on `#141416` | ~5.2:1 | AA |
| `#4a9eff` on `#141416` | ~5.8:1 | AA |
| `#00e676` on `#0c0c0e` | ~8.5:1 | AAA |

---

### 8.5 Typography

| Role | Font | Size | Weight | Line-Height |
|------|------|------|--------|-------------|
| Code (editor) | Geist Mono, Fira Code, monospace | 14px | 400 | 1.5 |
| UI labels | Geist, Inter, system-ui | 12px | 500 | 1.2 |
| UI body | Geist, Inter, system-ui | 14px | 400 | 1.5 |
| Section headings | Geist, Inter, system-ui | 16px | 600 | 1.3 |
| Chapter titles | Cormorant Garamond, serif | 28-36px | 300 | 1.15 |
| Value readouts | Monospace | 12px | 400 | 1.0 |

**Size Scale (Major Third - 1.25):** 11px - 12px - 14px - 16px - 20px - 24px - 30px - 36px

---

### 8.6 Responsive Patterns

| Viewport | Layout |
|----------|--------|
| >= 1024px | Side-by-side editor + preview |
| 768-1023px | Stacked with tabs (Code/Preview/Controls) |
| < 768px | Single column, accordion sections |

**Touch targets:** 44x44px minimum. Control height: 44px on touch vs 28-32px desktop.

**Canvas:** Full viewport width on mobile, 56.25% height (16:9). `devicePixelRatio` scaling.

---

### 8.7 Interaction Micro-Patterns

**Keyboard:**

| Action | Key |
|--------|-----|
| Compile/Run | Ctrl+Enter |
| Toggle preview | Ctrl+P |
| Toggle controls | Ctrl+K |
| Reset | Ctrl+R |
| Full-screen | F11 |

**Value Scrubbing (Blender pattern):** Click+drag on numeric value. Shift+drag = 10x precision. Ctrl+drag = 0.1x precision.

**Animation Timing:**

| Action | Duration | Easing |
|--------|----------|--------|
| Panel expand/collapse | 200ms | ease-out |
| Folder open/close | 150ms | ease-out |
| Tab switch | 100ms | ease-in-out |
| Error highlight appear | 300ms | ease-out |
| Tooltip | 200ms delay, 150ms fade-in | ease-out |

---

## Master Source Index

### Theoretical Foundation
- [Bertin - Semiology of Graphics](https://nicolas.kruchten.com/semiology_of_graphics/)
- [Munzner - VAD Book](https://www.cs.ubc.ca/~tmm/vadbook/)
- [Bottosson - Oklab](https://bottosson.github.io/posts/oklab/)
- [ColorBrewer](https://colorbrewer2.org/)
- [D3 Scale - Observable](https://d3js.org/d3-scale)
- [MilkDrop Preset Authoring](https://www.geisswerks.com/milkdrop/milkdrop_preset_authoring.html)
- [Harvard Art Museums - Light Prop](https://harvardartmuseums.org/collections/object/299819)
- [Spring-It-On](https://theorangeduck.com/page/spring-roll-call)

### Signal Processing
- [MDN: AnalyserNode](https://developer.mozilla.org/en-US/docs/Web/API/AnalyserNode)
- [Beat Detection Using Web Audio](http://joesul.li/van/beat-detection-using-web-audio/)
- [web-audio-beat-detector](https://github.com/chrisguttandin/web-audio-beat-detector)
- [Web-Onset](https://github.com/Keavon/Web-Onset)
- [kalmanjs](https://github.com/wouterbulten/kalmanjs)
- [Codrops: Audio-Reactive Particles](https://tympanus.net/codrops/2023/12/19/creating-audio-reactive-visuals-with-dynamic-particles-in-three-js/)
- [Tone.js](https://tonejs.github.io/)

### WebGL
- [MDN WebGL Best Practices](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API/WebGL_best_practices)
- [WebGL Anti-Patterns](https://webglfundamentals.org/webgl/lessons/webgl-anti-patterns.html)
- [WebGL2 What's New](https://webgl2fundamentals.org/webgl/lessons/webgl2-whats-new.html)
- [Emscripten: Optimizing WebGL](https://emscripten.org/docs/optimizing/Optimizing-WebGL.html)
- [Khronos PBO Documentation](https://www.khronos.org/opengl/wiki/Pixel_Buffer_Object)

### GLSL
- [Inigo Quilez - Articles](https://iquilezles.org/articles/)
- [The Book of Shaders](https://thebookofshaders.com/)
- [ashima/webgl-noise](https://github.com/ashima/webgl-noise/wiki)
- [gl-Noise Library](https://farazzshaikh.github.io/glNoise/)
- [hg_sdf Library](https://mercury.sexy/hg_sdf/)
- [GLSL-Color-Functions](https://github.com/Rachmanin0xFF/GLSL-Color-Functions)
- [Reaction-Diffusion Playground](https://github.com/jasonwebb/reaction-diffusion-playground)

### Libraries
- [p5.FFT Reference](https://p5js.org/reference/p5.sound/p5.FFT/)
- [ShaderToy How To](https://www.shadertoy.com/howto)
- [cables.gl Docs](https://cables.gl/docs/)
- [Hydra Video Synth](https://hydra.ojack.xyz/)
- [Theatre.js](https://www.theatrejs.com/docs/latest/api/core)
- [Leva (pmndrs)](https://github.com/pmndrs/leva)
- [regl API](https://github.com/regl-project/regl/blob/main/API.md)
- [twgl.js](https://twgljs.org/)
- [OGL](https://oframe.github.io/ogl/)

### Three.js Integration
- [R3F Hooks](https://r3f.docs.pmnd.rs/api/hooks)
- [drei shaderMaterial](https://drei.docs.pmnd.rs/shaders/shader-material)
- [CSM GitHub](https://github.com/FarazzShaikh/THREE-CustomShaderMaterial)
- [postprocessing wiki](https://github.com/pmndrs/postprocessing/wiki/Custom-Effects)
- [troika createDerivedMaterial](https://protectwise.github.io/troika/troika-three-utils/createDerivedMaterial/)

### Documentation Design
- [Mintlify: Stripe Docs](https://www.mintlify.com/blog/stripe-docs)
- [Frontend Horse: The Linear Look](https://frontend.horse/articles/the-linear-look/)
- [Codapi](https://codapi.org/)
- [GitHub: DDD](https://gist.github.com/zsup/9434452)
- [heerich.js](https://meodai.github.io/heerich/)

### UI/UX
- [lil-gui](https://lil-gui.georgealways.com/)
- [CodeMirror 6](https://codemirror.net/)
- [Sourcegraph: Monaco to CodeMirror](https://sourcegraph.com/blog/migrating-monaco-codemirror)
