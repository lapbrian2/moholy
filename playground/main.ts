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
  const vs = compileShader(gl, gl.VERTEX_SHADER, vert)
  const fs = compileShader(gl, gl.FRAGMENT_SHADER, frag)
  if (!vs || !fs) return null
  const prog = gl.createProgram()!
  gl.attachShader(prog, vs)
  gl.attachShader(prog, fs)
  gl.linkProgram(prog)
  return prog
}

function compileShader(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
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

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

// ============================================================
// HERO — full-screen ambient visual
// ============================================================

;(function initHero() {
  const canvas = document.getElementById('heroGL') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2 uRes;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    uv.x *= aspect;

    float t = uTime * 0.08;
    float n1 = fbm(uv * 3.0 + t);
    float n2 = fbm(uv * 5.0 - t * 0.7 + n1 * 0.5);
    float n3 = fbm(uv * 2.0 + n2 * 0.8 + t * 0.3);

    // Dark palette: deep navy, muted gold, charcoal
    vec3 c1 = vec3(0.04, 0.04, 0.08);  // near-black
    vec3 c2 = vec3(0.08, 0.06, 0.12);  // deep purple
    vec3 c3 = vec3(0.15, 0.12, 0.06);  // dark gold
    vec3 c4 = vec3(0.05, 0.08, 0.12);  // dark teal

    vec3 col = mix(c1, c2, n1);
    col = mix(col, c3, n2 * 0.4);
    col = mix(col, c4, n3 * 0.3);

    // Subtle golden highlights on ridges
    float ridge = smoothstep(0.45, 0.55, n2);
    col += vec3(0.12, 0.09, 0.04) * ridge * 0.5;

    // Vignette
    vec2 vc = (vUv - 0.5) * 2.0;
    float vignette = 1.0 - dot(vc, vc) * 0.3;
    col *= vignette;

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const uTime = gl.getUniformLocation(prog, 'uTime')
  const uRes = gl.getUniformLocation(prog, 'uRes')

  function render(t: number) {
    gl!.uniform1f(uTime, t / 1000)
    gl!.uniform2f(uRes, canvas.width, canvas.height)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)

  window.addEventListener('resize', () => sizeCanvas(canvas, gl!))
})()

// ============================================================
// PALETTE STRIPS
// ============================================================

;(function initPalettes() {
  const container = document.getElementById('paletteStrips')
  if (!container) return

  const names: PaletteName[] = ['thermal', 'ocean', 'neon', 'monochrome', 'spectral']

  for (const name of names) {
    const row = document.createElement('div')
    row.style.cssText = 'display: flex; align-items: center; gap: 12px;'

    const label = document.createElement('span')
    label.style.cssText = `
      font-family: var(--mono); font-size: 11px; color: var(--text-muted);
      min-width: 90px; text-align: right; letter-spacing: 0.03em;
    `
    label.textContent = name

    const strip = document.createElement('canvas')
    strip.width = 512
    strip.height = 32
    strip.style.cssText = 'flex: 1; height: 32px; border: 1px solid var(--border);'

    const ctx = strip.getContext('2d')!
    for (let x = 0; x < 512; x++) {
      const t = x / 511
      const rgb = samplePalette(name, t)
      ctx.fillStyle = `rgb(${Math.round(rgb.r * 255)},${Math.round(rgb.g * 255)},${Math.round(rgb.b * 255)})`
      ctx.fillRect(x, 0, 1, 32)
    }

    row.appendChild(label)
    row.appendChild(strip)
    container.appendChild(row)
  }
})()

// ============================================================
// I. SIGNALS DEMO — clock with inspector
// ============================================================

;(function initSignalDemo() {
  const canvas = document.getElementById('signalDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 3 })
  sig.connect()

  // Inspector bars
  const inspEl = document.getElementById('signalInspector')!
  for (let i = 0; i < 6; i++) {
    const bar = document.createElement('div')
    bar.className = 'inspector-bar'
    bar.innerHTML = `<div class="inspector-bar-fill" id="sigBar${i}" style="height:0%"></div>`
    inspEl.appendChild(bar)
  }

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uChannels[6];
  uniform float uTime;

  void main() {
    // Each channel drives a vertical band
    float band = floor(vUv.x * 6.0);
    float value = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) == band) value = uChannels[i];
    }

    float bar = step(1.0 - vUv.y, value);
    vec3 col = mix(
      vec3(0.06, 0.06, 0.08),
      vec3(0.78, 0.66, 0.42),
      bar * 0.6
    );

    // Grid lines
    float gridX = step(0.98, fract(vUv.x * 6.0));
    float gridY = step(0.98, fract(vUv.y * 10.0));
    col = mix(col, vec3(0.12, 0.12, 0.14), max(gridX, gridY));

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  const uChannels = gl.getUniformLocation(prog, 'uChannels')
  const uTime = gl.getUniformLocation(prog, 'uTime')

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    sig.update(dt)

    gl!.uniform1fv(uChannels, sig.data)
    gl!.uniform1f(uTime, t / 1000)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)

    for (let i = 0; i < 6; i++) {
      const el = document.getElementById(`sigBar${i}`)
      if (el) el.style.height = (sig.data[i] * 100) + '%'
    }

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// II. ENCODINGS DEMO — palette + displacement + emission
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
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0;

    float n = fbm(uv * 3.0 + uTime * 0.2);
    uv += vec2(n - 0.5) * uDisplacement;

    float d = length(uv);

    // Organic blob
    float angle = atan(uv.y, uv.x);
    float wobble = 0.0;
    for (int i = 1; i <= 5; i++) {
      float fi = float(i);
      wobble += sin(angle * fi + uTime * fi * 0.3) * (0.08 / fi);
    }
    float radius = 0.6 + wobble;
    float shape = smoothstep(radius + 0.02, radius - 0.02, d);

    vec3 col = uColor * (0.5 + shape * 0.5);
    col += uColor * uEmission * shape * (1.0 - d * 0.8);

    // Subtle inner glow
    float inner = smoothstep(0.5, 0.0, d) * shape;
    col += vec3(1.0) * inner * uEmission * 0.15;

    // Background gradient
    vec3 bg = mix(vec3(0.04, 0.04, 0.06), vec3(0.06, 0.05, 0.08), vUv.y);
    col = mix(bg, col, shape * 0.9 + 0.1 * smoothstep(radius + 0.15, radius, d));

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  // Controls
  const paletteSelect = document.getElementById('paletteSelect') as HTMLSelectElement
  const displaceRange = document.getElementById('displaceRange') as HTMLInputElement
  const emissionRange = document.getElementById('emissionRange') as HTMLInputElement

  let currentPalette: PaletteName = 'spectral'
  let displaceScale = 0.4
  let emissionScale = 1.5

  paletteSelect?.addEventListener('change', () => {
    currentPalette = paletteSelect.value as PaletteName
    vis.dispose()
    vis = encode(sig, {
      color: { channel: 2, palette: currentPalette },
      displacement: { channel: 3, range: [-displaceScale, displaceScale], smooth: 0.05 },
      emission: { channel: 4, range: [0.0, emissionScale] },
    })
    sig.connect()
  })

  displaceRange?.addEventListener('input', () => {
    displaceScale = parseFloat(displaceRange.value) / 100
  })

  emissionRange?.addEventListener('input', () => {
    emissionScale = (parseFloat(emissionRange.value) / 100) * 3
  })

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    vis.update(dt)

    const u = vis.uniforms
    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uTime'), t / 1000)
    gl!.uniform3f(gl!.getUniformLocation(prog!, 'uColor'), u.color.r, u.color.g, u.color.b)
    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uDisplacement'), u.displacement)
    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uEmission'), u.emission)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)

    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// IV. TRANSFORMS DEMO — smooth vs raw
// ============================================================

;(function initTransformDemo() {
  const canvas = document.getElementById('transformDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 2 })
  const rawEnc = encode(sig, {
    displacement: { channel: 4, range: [0, 1] },
  })
  const smoothEnc = encode(sig, {
    displacement: { channel: 4, range: [0, 1], smooth: 0.85 },
  })
  sig.connect()

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uRaw;
  uniform float uSmooth;

  void main() {
    vec3 bg = vec3(0.04, 0.04, 0.06);

    // Raw signal line (left half)
    float rawLine = step(abs(vUv.y - uRaw), 0.005);
    // Smooth signal line (right half)
    float smoothLine = step(abs(vUv.y - uSmooth), 0.005);

    // Trail history — vertical bars
    float rawBar = step(1.0 - vUv.y, uRaw) * step(vUv.x, 0.48);
    float smoothBar = step(1.0 - vUv.y, uSmooth) * step(0.52, vUv.x);

    vec3 col = bg;
    col = mix(col, vec3(0.5, 0.3, 0.2), rawBar * 0.15);
    col = mix(col, vec3(0.78, 0.66, 0.42), smoothBar * 0.25);

    // Center divider
    float divider = step(abs(vUv.x - 0.5), 0.002);
    col = mix(col, vec3(0.15, 0.15, 0.17), divider);

    // Labels area (implied by visual split)
    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000
    last = t
    rawEnc.update(dt)
    smoothEnc.update(dt)

    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uRaw'), rawEnc.uniforms.displacement)
    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uSmooth'), smoothEnc.uniforms.displacement)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// V. NOISE DEMO — FBM
// ============================================================

;(function initNoiseDemo() {
  const canvas = document.getElementById('noiseDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 4; i++) { v += a * noise(p); p *= 2.0; a *= 0.5; }
    return v;
  }

  void main() {
    vec2 uv = vUv * 6.0;
    float t = uTime * 0.15;

    float n1 = fbm(uv + t);
    float n2 = fbm(uv * 1.5 + n1 * 0.5 - t * 0.5);
    float n3 = fbm(uv * 0.8 + n2 * 0.8 + t * 0.3);

    // Topographic contour lines
    float contour = fract(n3 * 8.0);
    float line = smoothstep(0.0, 0.04, contour) * smoothstep(0.08, 0.04, contour);

    vec3 base = mix(vec3(0.04, 0.05, 0.06), vec3(0.08, 0.07, 0.1), n3);
    vec3 lineColor = vec3(0.78, 0.66, 0.42) * 0.4;

    vec3 col = mix(base, lineColor, line * 0.8);

    // Subtle elevation shading
    col += vec3(0.05) * smoothstep(0.4, 0.7, n3);

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog)
  setupQuad(gl, prog)

  function render(t: number) {
    gl!.uniform1f(gl!.getUniformLocation(prog!, 'uTime'), t / 1000)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// VI. PLAYGROUND — editable code + live preview
// ============================================================

;(function initPlayground() {
  const canvas = document.getElementById('playgroundCanvas') as HTMLCanvasElement
  const editor = document.getElementById('editor') as HTMLTextAreaElement
  const runBtn = document.getElementById('runBtn') as HTMLButtonElement
  const errorBanner = document.getElementById('errorBanner') as HTMLDivElement
  const fpsEl = document.getElementById('playgroundFps') as HTMLElement
  const inspEl = document.getElementById('playgroundInspector') as HTMLElement

  const gl = createGL(canvas)
  if (!gl) return

  let activeSig: Signal | null = null
  let activeEnc: EncodedOutput | null = null
  let program: WebGLProgram | null = null
  let animFrame: number | null = null
  let lastTime = 0

  const FRAG = `
  precision mediump float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;
  uniform float uOpacity;
  uniform float uScale;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
               mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0 * uScale;
    float n = noise(uv * 4.0 + uTime * 0.3);
    uv += vec2(n - 0.5) * uDisplacement;
    float d = length(uv);

    float angle = atan(uv.y, uv.x);
    float wobble = 0.0;
    for (int i = 1; i <= 5; i++) {
      float fi = float(i);
      wobble += sin(angle * fi + uTime * fi * 0.3) * (0.06 / fi);
    }
    float radius = 0.7 + wobble;
    float shape = smoothstep(radius + 0.02, radius - 0.02, d);

    vec3 col = uColor * (0.4 + shape * 0.6);
    col += uColor * uEmission * shape * (1.0 - d * 0.7);

    vec3 bg = vec3(0.04, 0.04, 0.06);
    col = mix(bg, col, shape * 0.85 + 0.15 * smoothstep(radius + 0.1, radius, d));

    gl_FragColor = vec4(col, uOpacity);
  }
  `

  program = compileProgram(gl, VERT, FRAG)
  if (!program) return
  gl.useProgram(program)
  setupQuad(gl, program)

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
window.__moholyMH = (e) => {
  sig.set([
    e.clientX / innerWidth,
    1 - e.clientY / innerHeight,
    Math.min(Math.abs(e.movementX) / 20, 1),
    Math.min(Math.abs(e.movementY) / 20, 1),
  ])
}
addEventListener('mousemove', window.__moholyMH)
const vis = encode(sig, {
  color:        { channel: 0, palette: 'ocean', smooth: 0.08 },
  displacement: { channel: 1, range: [-0.5, 0.5], smooth: 0.06 },
  emission:     { channel: 2, range: [0.0, 3.0], smooth: 0.3 },
  scale:        { channel: 3, range: [0.8, 1.2], smooth: 0.2 },
})
sig.connect()
return { signal: sig, encoding: vis }`,
  }

  function buildInspector(sig: Signal) {
    inspEl.innerHTML = ''
    const n = Math.min(sig.channels, 16)
    for (let i = 0; i < n; i++) {
      const bar = document.createElement('div')
      bar.className = 'inspector-bar'
      bar.innerHTML = `<div class="inspector-bar-fill" id="pgBar${i}" style="height:0%"></div>`
      inspEl.appendChild(bar)
    }
  }

  function refreshInspector(sig: Signal) {
    const n = Math.min(sig.channels, 16)
    for (let i = 0; i < n; i++) {
      const el = document.getElementById(`pgBar${i}`)
      if (el) el.style.height = (sig.data[i] * 100) + '%'
    }
  }

  function cleanup() {
    if (animFrame) cancelAnimationFrame(animFrame)
    animFrame = null
    if (activeEnc) activeEnc.dispose()
    if (activeSig) activeSig.disconnect()
    activeSig = null
    activeEnc = null
    if ((window as any).__moholyMH) {
      removeEventListener('mousemove', (window as any).__moholyMH)
      delete (window as any).__moholyMH
    }
  }

  function runCode(code: string) {
    cleanup()
    errorBanner.style.display = 'none'
    try {
      const fn = new Function('signal', 'encode', code)
      const result = fn(signal, encode)
      if (result?.signal && result?.encoding) {
        activeSig = result.signal
        activeEnc = result.encoding
        buildInspector(activeSig!)
        lastTime = 0
        animFrame = requestAnimationFrame(render)
      } else {
        showError('Must return { signal, encoding }')
      }
    } catch (e: any) {
      showError(e.message)
    }
  }

  function showError(msg: string) {
    errorBanner.textContent = msg
    errorBanner.style.display = 'block'
  }

  function render(t: number) {
    const dt = lastTime === 0 ? 0.016 : (t - lastTime) / 1000
    lastTime = t
    if (activeEnc) activeEnc.update(dt)
    if (gl && program && activeEnc) {
      gl.clearColor(0.04, 0.04, 0.05, 1)
      gl.clear(gl.COLOR_BUFFER_BIT)
      const u = activeEnc.uniforms
      gl.uniform1f(gl.getUniformLocation(program, 'uTime'), t / 1000)
      gl.uniform3f(gl.getUniformLocation(program, 'uColor'), u.color.r, u.color.g, u.color.b)
      gl.uniform1f(gl.getUniformLocation(program, 'uDisplacement'), u.displacement)
      gl.uniform1f(gl.getUniformLocation(program, 'uEmission'), u.emission)
      gl.uniform1f(gl.getUniformLocation(program, 'uOpacity'), u.opacity)
      gl.uniform1f(gl.getUniformLocation(program, 'uScale'), u.scale)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    if (activeSig) refreshInspector(activeSig)
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
      document.querySelectorAll('.preset-btn').forEach((b) => { (b as HTMLElement).style.borderColor = 'var(--border)'; (b as HTMLElement).style.color = 'var(--text-dim)' })
      ;(btn as HTMLElement).style.borderColor = 'var(--accent)'
      ;(btn as HTMLElement).style.color = 'var(--accent)'
      const preset = (btn as HTMLElement).dataset.preset!
      editor.value = PRESETS[preset] ?? ''
      runCode(editor.value)
    })
  })

  // Init
  editor.value = PRESETS.clock
  runCode(editor.value)
})()

// ============================================================
// RESIZE
// ============================================================

window.addEventListener('resize', () => {
  document.querySelectorAll('.demo-canvas-wrap canvas, .hero-canvas canvas').forEach((c) => {
    const canvas = c as HTMLCanvasElement
    const gl = canvas.getContext('webgl')
    if (gl) sizeCanvas(canvas, gl)
  })
})
