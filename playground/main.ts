import { signal, encode, samplePalette, PALETTES } from 'moholy'
import type { Signal, EncodedOutput, PaletteName } from 'moholy'

// ============================================================
// SHARED WEBGL HELPERS
// ============================================================

function createGL(canvas: HTMLCanvasElement): WebGLRenderingContext | null {
  const gl = canvas.getContext('webgl', { alpha: true, antialias: true, premultipliedAlpha: false })
  if (!gl) return null
  sizeCanvas(canvas, gl)
  return gl
}

function sizeCanvas(canvas: HTMLCanvasElement, gl: WebGLRenderingContext) {
  const rect = canvas.parentElement!.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
  gl.viewport(0, 0, canvas.width, canvas.height)
}

function compileProgram(gl: WebGLRenderingContext, vert: string, frag: string): WebGLProgram | null {
  const vs = compileSh(gl, gl.VERTEX_SHADER, vert)
  const fs = compileSh(gl, gl.FRAGMENT_SHADER, frag)
  if (!vs || !fs) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(prog))
    return null
  }
  return prog
}

function compileSh(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(s))
    return null
  }
  return s
}

function setupQuad(gl: WebGLRenderingContext, program: WebGLProgram) {
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
}

// Uniform location cache — from WebGL best practices research
function getUniforms(gl: WebGLRenderingContext, prog: WebGLProgram, names: string[]) {
  const locs: Record<string, WebGLUniformLocation | null> = {}
  for (const n of names) locs[n] = gl.getUniformLocation(prog, n)
  return locs
}

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// ============================================================
// SHARED GLSL — noise functions used across demos
// From GLSL Techniques research (Quilez patterns)
// ============================================================

const GLSL_NOISE = `
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = rot * p * 2.0 + 100.0; a *= 0.5; }
  return v;
}
`

// Cosine palette from Quilez — the single most useful color technique
const GLSL_COSINE_PALETTE = `
vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}
`

// ============================================================
// GLOBAL STATE — shared across all demos
// ============================================================

let globalPeriod = 3.0
let globalPalette: PaletteName = 'spectral'
let globalSmooth = 0.2

const globalPeriodInput = document.getElementById('globalPeriod') as HTMLInputElement
const globalPeriodVal = document.getElementById('globalPeriodVal')!
const globalPaletteInput = document.getElementById('globalPalette') as HTMLSelectElement
const globalSmoothInput = document.getElementById('globalSmooth') as HTMLInputElement
const globalSmoothVal = document.getElementById('globalSmoothVal')!
const globalPanel = document.getElementById('globalPanel')!
const panelFps = document.getElementById('panelFps')!

globalPeriodInput?.addEventListener('input', () => {
  globalPeriod = parseFloat(globalPeriodInput.value)
  globalPeriodVal.textContent = globalPeriod.toFixed(1) + 's'
})

globalPaletteInput?.addEventListener('change', () => {
  globalPalette = globalPaletteInput.value as PaletteName
})

globalSmoothInput?.addEventListener('input', () => {
  globalSmooth = parseFloat(globalSmoothInput.value) / 100
  globalSmoothVal.textContent = globalSmooth.toFixed(2)
})

// Show panel after scrolling past hero
const observer = new IntersectionObserver(([entry]) => {
  globalPanel.classList.toggle('visible', !entry.isIntersecting)
}, { threshold: 0.3 })
const heroEl = document.querySelector('.hero')
if (heroEl) observer.observe(heroEl)

// ============================================================
// OSCILLOSCOPE — Canvas 2D waveform renderer
// From Signal Processing + UI Patterns research
// ============================================================

function drawOscilloscope(canvas: HTMLCanvasElement, data: Float32Array, channels: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return

  const rect = canvas.parentElement!.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr

  const w = canvas.width
  const h = canvas.height
  const n = Math.min(channels, data.length)

  // Background
  ctx.fillStyle = '#141416'
  ctx.fillRect(0, 0, w, h)

  // Grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.04)'
  ctx.lineWidth = 1
  for (let y = 0; y < h; y += h / 4) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke()
  }

  // Center line
  ctx.strokeStyle = 'rgba(255,255,255,0.08)'
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()

  // Waveform — signal-green from research palette
  ctx.strokeStyle = '#00e676'
  ctx.lineWidth = 2 * dpr
  ctx.beginPath()

  const step = w / (n - 1)
  for (let i = 0; i < n; i++) {
    const x = i * step
    const y = h - data[i] * h
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.stroke()

  // Channel labels
  ctx.fillStyle = '#55556a'
  ctx.font = `${9 * dpr}px "Geist Mono", monospace`
  for (let i = 0; i < n; i++) {
    const x = i * step
    ctx.fillText(`${i}`, x + 2, 10 * dpr)
  }
}

// ============================================================
// HERO — domain-warped FBM with cosine palette (Quilez)
// ============================================================

;(function initHero() {
  const canvas = document.getElementById('heroGL') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;
  ${GLSL_NOISE}
  ${GLSL_COSINE_PALETTE}

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    uv.x *= aspect;

    float t = uTime * 0.06;

    // Double domain warp (Quilez method)
    vec2 q = vec2(fbm(uv * 2.0 + vec2(0.0, 0.0) + t),
                  fbm(uv * 2.0 + vec2(5.2, 1.3) + t * 0.7));
    vec2 r = vec2(fbm(uv * 2.0 + 4.0 * q + vec2(1.7, 9.2) + t * 0.3),
                  fbm(uv * 2.0 + 4.0 * q + vec2(8.3, 2.8) + t * 0.5));
    float f = fbm(uv * 2.0 + 4.0 * r);

    // Cosine palette — warm gold on dark (Bauhaus aesthetic)
    vec3 col = cosPalette(f,
      vec3(0.05, 0.04, 0.03),   // bias: very dark
      vec3(0.15, 0.12, 0.08),   // amplitude: subtle
      vec3(1.0, 0.8, 0.5),      // frequency
      vec3(0.0, 0.1, 0.2)       // phase
    );

    // Add subtle golden ridge highlights
    float ridge = smoothstep(0.45, 0.55, fract(f * 6.0));
    col += vec3(0.10, 0.08, 0.03) * ridge * 0.4;

    // Vignette
    vec2 vc = (vUv - 0.5) * 2.0;
    col *= 1.0 - dot(vc, vc) * 0.25;

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const u = getUniforms(gl, prog, ['uTime', 'uRes'])

  function render(t: number) {
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.uniform2f(u.uRes, canvas.width, canvas.height)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
  window.addEventListener('resize', () => sizeCanvas(canvas, gl!))
})()

// ============================================================
// PALETTE STRIPS — animated value sweep
// ============================================================

;(function initPalettes() {
  const container = document.getElementById('paletteStrips')
  if (!container) return

  const names: PaletteName[] = ['thermal', 'ocean', 'neon', 'monochrome', 'spectral']
  for (const name of names) {
    const row = document.createElement('div')
    row.className = 'palette-row'

    const label = document.createElement('span')
    label.className = 'palette-label'
    label.textContent = name

    const strip = document.createElement('canvas')
    strip.className = 'palette-strip'
    strip.width = 512
    strip.height = 32

    const ctx = strip.getContext('2d')!
    for (let x = 0; x < 512; x++) {
      const t = x / 511
      const rgb = samplePalette(name, t)
      ctx.fillStyle = `rgb(${rgb.r * 255 | 0},${rgb.g * 255 | 0},${rgb.b * 255 | 0})`
      ctx.fillRect(x, 0, 1, 32)
    }

    row.appendChild(label)
    row.appendChild(strip)
    container.appendChild(row)
  }
})()

// ============================================================
// I. SIGNALS DEMO — with oscilloscope waveform
// ============================================================

;(function initSignalDemo() {
  const canvas = document.getElementById('signalDemo') as HTMLCanvasElement
  const scopeCanvas = document.getElementById('signalScope') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 3 })
  sig.connect()

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uChannels[6];
  ${GLSL_NOISE}

  void main() {
    float band = floor(vUv.x * 6.0);
    float value = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) == band) value = uChannels[i];
    }

    float bar = step(1.0 - vUv.y, value);

    // Subtle noise texture on bars
    float n = noise(vUv * 40.0) * 0.05;

    vec3 barColor = vec3(0.78, 0.66, 0.42); // accent gold
    vec3 bgColor = vec3(0.05, 0.05, 0.06);
    vec3 col = mix(bgColor, barColor * (0.5 + value * 0.5) + n, bar * 0.7);

    // Grid
    float gridX = step(0.97, fract(vUv.x * 6.0));
    float gridY = step(0.97, fract(vUv.y * 10.0));
    col = mix(col, vec3(0.1, 0.1, 0.12), max(gridX, gridY));

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const u = getUniforms(gl, prog, ['uChannels'])

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    sig.update(dt)

    gl!.uniform1fv(u.uChannels, sig.data)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)

    // Oscilloscope
    drawOscilloscope(scopeCanvas, sig.data, 6)

    // Update global panel FPS
    if (dt > 0) panelFps.textContent = Math.round(1 / dt) + 'fps'

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// II. ENCODINGS DEMO — organic metaball with Quilez cosine palette
// ============================================================

;(function initEncodeDemo() {
  const canvas = document.getElementById('encodeDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 4 })
  let vis = encode(sig, {
    color: { channel: 2, palette: 'spectral' },
    displacement: { channel: 3, range: [-0.4, 0.4], smooth: 0.05 },
    emission: { channel: 4, range: [0.0, 1.5] },
  })
  sig.connect()

  const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;
  ${GLSL_NOISE}

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;

    // Domain warp for organic shape
    float n = fbm(uv * 2.5 + uTime * 0.15);
    uv += vec2(n - 0.5) * uDisplacement;

    float d = length(uv);

    // Organic wobble (5 harmonics)
    float angle = atan(uv.y, uv.x);
    float wobble = 0.0;
    for (int i = 1; i <= 5; i++) {
      float fi = float(i);
      wobble += sin(angle * fi + uTime * fi * 0.25) * (0.07 / fi);
    }
    float radius = 0.6 + wobble;
    float shape = smoothstep(radius + 0.02, radius - 0.02, d);

    // Color with emission glow
    vec3 col = uColor * (0.4 + shape * 0.6);
    col += uColor * uEmission * shape * (1.0 - d * 0.7);

    // Inner glow
    float inner = smoothstep(0.4, 0.0, d) * shape;
    col += vec3(1.0) * inner * uEmission * 0.12;

    // Background — very subtle gradient
    vec3 bg = mix(vec3(0.04, 0.04, 0.055), vec3(0.05, 0.045, 0.06), vUv.y);
    col = mix(bg, col, shape * 0.9 + 0.1 * smoothstep(radius + 0.12, radius, d));

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const u = getUniforms(gl, prog, ['uTime', 'uColor', 'uDisplacement', 'uEmission'])

  // Controls
  const paletteSelect = document.getElementById('paletteSelect') as HTMLSelectElement
  const displaceRange = document.getElementById('displaceRange') as HTMLInputElement
  const emissionRange = document.getElementById('emissionRange') as HTMLInputElement

  paletteSelect?.addEventListener('change', () => {
    vis.dispose()
    vis = encode(sig, {
      color: { channel: 2, palette: paletteSelect.value as PaletteName },
      displacement: { channel: 3, range: [-parseFloat(displaceRange.value) / 100, parseFloat(displaceRange.value) / 100], smooth: 0.05 },
      emission: { channel: 4, range: [0.0, (parseFloat(emissionRange.value) / 100) * 3] },
    })
    sig.connect()
  })

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    vis.update(dt)

    const c = vis.uniforms
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.uniform3f(u.uColor, c.color.r, c.color.g, c.color.b)
    gl!.uniform1f(u.uDisplacement, c.displacement)
    gl!.uniform1f(u.uEmission, c.emission)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// IV. TRANSFORMS DEMO — smooth vs raw split comparison
// ============================================================

;(function initTransformDemo() {
  const canvas = document.getElementById('transformDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 2 })
  const rawEnc = encode(sig, { displacement: { channel: 4, range: [0, 1] } })
  const smoothEnc = encode(sig, { displacement: { channel: 4, range: [0, 1], smooth: 0.85 } })
  sig.connect()

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uRaw;
  uniform float uSmooth;

  void main() {
    vec3 bg = vec3(0.04, 0.04, 0.055);

    // Left half: raw signal bar
    float rawBar = step(1.0 - vUv.y, uRaw) * step(vUv.x, 0.48);
    // Right half: smooth signal bar
    float smoothBar = step(1.0 - vUv.y, uSmooth) * step(0.52, vUv.x);

    vec3 col = bg;
    col = mix(col, vec3(0.35, 0.25, 0.15), rawBar * 0.25);     // dim gold for raw
    col = mix(col, vec3(0.78, 0.66, 0.42), smoothBar * 0.35);   // accent gold for smooth

    // Center divider
    float divider = step(abs(vUv.x - 0.5), 0.001);
    col = mix(col, vec3(0.15, 0.15, 0.17), divider);

    // Horizontal grid
    float grid = step(0.98, fract(vUv.y * 10.0));
    col = mix(col, vec3(0.08, 0.08, 0.1), grid);

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const u = getUniforms(gl, prog, ['uRaw', 'uSmooth'])

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    rawEnc.update(dt)
    smoothEnc.update(dt)

    gl!.uniform1f(u.uRaw, rawEnc.uniforms.displacement)
    gl!.uniform1f(u.uSmooth, smoothEnc.uniforms.displacement)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// V. NOISE DEMO — domain-warped FBM topographic contours
// ============================================================

;(function initNoiseDemo() {
  const canvas = document.getElementById('noiseDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  ${GLSL_NOISE}
  ${GLSL_COSINE_PALETTE}

  void main() {
    vec2 uv = vUv * 5.0;
    float t = uTime * 0.12;

    // Domain warp
    vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3) + t * 0.7));
    float n = fbm(uv + 3.0 * q);

    // Topographic contour lines
    float contour = fract(n * 10.0);
    float line = smoothstep(0.0, 0.03, contour) * smoothstep(0.06, 0.03, contour);

    // Cosine palette for elevation coloring
    vec3 elevation = cosPalette(n,
      vec3(0.04, 0.04, 0.05),
      vec3(0.08, 0.06, 0.04),
      vec3(1.0, 0.8, 0.6),
      vec3(0.0, 0.15, 0.25)
    );

    vec3 lineColor = vec3(0.78, 0.66, 0.42) * 0.5;
    vec3 col = mix(elevation, lineColor, line * 0.7);

    // Subtle elevation highlight
    col += vec3(0.04) * smoothstep(0.5, 0.8, n);

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const u = getUniforms(gl, prog, ['uTime'])

  function render(t: number) {
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// VI. PLAYGROUND — editable code + live preview + oscilloscope
// ============================================================

;(function initPlayground() {
  const canvas = document.getElementById('playgroundCanvas') as HTMLCanvasElement
  const scopeCanvas = document.getElementById('playgroundScope') as HTMLCanvasElement
  const editor = document.getElementById('editor') as HTMLTextAreaElement
  const runBtn = document.getElementById('runBtn') as HTMLButtonElement
  const errorBanner = document.getElementById('errorBanner') as HTMLDivElement
  const fpsEl = document.getElementById('playgroundFps') as HTMLElement

  const gl = createGL(canvas)
  if (!gl) return

  let activeSig: Signal | null = null
  let activeEnc: EncodedOutput | null = null
  let program: WebGLProgram | null = null
  let animFrame: number | null = null
  let lastTime = 0

  const FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;
  uniform float uOpacity;
  uniform float uScale;
  ${GLSL_NOISE}

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0 * uScale;
    float n = fbm(uv * 3.0 + uTime * 0.2);
    uv += vec2(n - 0.5) * uDisplacement;
    float d = length(uv);

    float angle = atan(uv.y, uv.x);
    float wobble = 0.0;
    for (int i = 1; i <= 6; i++) {
      float fi = float(i);
      wobble += sin(angle * fi + uTime * fi * 0.2) * (0.06 / fi);
    }
    float radius = 0.65 + wobble;
    float shape = smoothstep(radius + 0.02, radius - 0.02, d);

    vec3 col = uColor * (0.35 + shape * 0.65);
    col += uColor * uEmission * shape * (1.0 - d * 0.6);
    float inner = smoothstep(0.35, 0.0, d) * shape;
    col += vec3(1.0) * inner * uEmission * 0.1;

    vec3 bg = vec3(0.04, 0.04, 0.055);
    col = mix(bg, col, shape * 0.85 + 0.15 * smoothstep(radius + 0.1, radius, d));

    gl_FragColor = vec4(col, uOpacity);
  }
  `

  program = compileProgram(gl, VERT, FRAG)
  if (!program) return
  gl.useProgram(program)
  setupQuad(gl, program)

  const uLocs = getUniforms(gl, program, ['uTime', 'uColor', 'uDisplacement', 'uEmission', 'uOpacity', 'uScale'])

  const PRESETS: Record<string, string> = {
    clock: `const sig = signal.clock({ period: 3 })
const vis = encode(sig, {
  color:        { channel: 2, palette: 'spectral' },
  displacement: { channel: 3, range: [-0.4, 0.4], smooth: 0.05 },
  emission:     { channel: 4, range: [0.0, 1.5] },
})
sig.connect()
return { signal: sig, encoding: vis }`,

    audio: `// Click run, then allow mic access
const sig = signal.audio({ fftSize: 128 })
const vis = encode(sig, {
  color:        { channel: 2, palette: 'neon', smooth: 0.3 },
  displacement: { channel: 8, range: [-0.6, 0.6], smooth: 0.15 },
  emission:     { channel: 0, range: [0.0, 2.0], smooth: 0.2 },
  opacity:      { channel: 16, range: [0.4, 1.0] },
})
sig.connect()
return { signal: sig, encoding: vis }`,

    mouse: `const sig = signal.array([0, 0, 0, 0])
window.__mh = (e) => {
  sig.set([
    e.clientX / innerWidth,
    1 - e.clientY / innerHeight,
    Math.min(Math.abs(e.movementX) / 20, 1),
    Math.min(Math.abs(e.movementY) / 20, 1),
  ])
}
addEventListener('mousemove', window.__mh)
const vis = encode(sig, {
  color:        { channel: 0, palette: 'ocean', smooth: 0.08 },
  displacement: { channel: 1, range: [-0.5, 0.5], smooth: 0.06 },
  emission:     { channel: 2, range: [0.0, 3.0], smooth: 0.3 },
  scale:        { channel: 3, range: [0.8, 1.2], smooth: 0.2 },
})
sig.connect()
return { signal: sig, encoding: vis }`,
  }

  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame)
    animFrame = null
    if (activeEnc) activeEnc.dispose()
    if (activeSig) activeSig.disconnect()
    activeSig = null
    activeEnc = null
    if ((window as any).__mh) {
      removeEventListener('mousemove', (window as any).__mh)
      delete (window as any).__mh
    }
  }

  function runCode(code: string) {
    cleanup()
    errorBanner.classList.remove('visible')
    try {
      const fn = new Function('signal', 'encode', code)
      const result = fn(signal, encode)
      if (result?.signal && result?.encoding) {
        activeSig = result.signal
        activeEnc = result.encoding
        lastTime = 0
        animFrame = requestAnimationFrame(render)
      } else {
        showError('Must return { signal, encoding }')
      }
    } catch (e: any) { showError(e.message) }
  }

  function showError(msg: string) {
    errorBanner.textContent = msg
    errorBanner.classList.add('visible')
  }

  function render(t: number) {
    const dt = lastTime === 0 ? 0.016 : (t - lastTime) / 1000
    lastTime = t
    if (activeEnc) activeEnc.update(dt)
    if (gl && program && activeEnc) {
      gl.clearColor(0.04, 0.04, 0.055, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const c = activeEnc.uniforms
      gl.uniform1f(uLocs.uTime, t / 1000)
      gl.uniform3f(uLocs.uColor, c.color.r, c.color.g, c.color.b)
      gl.uniform1f(uLocs.uDisplacement, c.displacement)
      gl.uniform1f(uLocs.uEmission, c.emission)
      gl.uniform1f(uLocs.uOpacity, c.opacity)
      gl.uniform1f(uLocs.uScale, c.scale)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    if (activeSig) drawOscilloscope(scopeCanvas, activeSig.data, Math.min(activeSig.channels, 16))
    if (dt > 0) fpsEl.textContent = Math.round(1 / dt) + 'fps'
    animFrame = requestAnimationFrame(render)
  }

  // Events
  runBtn.addEventListener('click', () => runCode(editor.value))
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(editor.value) }
    if (e.key === 'Tab') { e.preventDefault(); const s = editor.selectionStart; editor.value = editor.value.slice(0, s) + '  ' + editor.value.slice(editor.selectionEnd); editor.selectionStart = editor.selectionEnd = s + 2 }
  })

  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach((b) => b.classList.remove('active'))
      btn.classList.add('active')
      editor.value = PRESETS[(btn as HTMLElement).dataset.preset!] ?? ''
      runCode(editor.value)
    })
  })

  editor.value = PRESETS.clock
  runCode(editor.value)
})()

// ============================================================
// RESIZE HANDLER
// ============================================================

window.addEventListener('resize', () => {
  document.querySelectorAll('.demo-wrap canvas, .hero-canvas canvas').forEach((c) => {
    const canvas = c as HTMLCanvasElement
    const gl = canvas.getContext('webgl')
    if (gl) sizeCanvas(canvas, gl)
  })
})
