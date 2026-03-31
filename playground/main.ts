import { signal, encode } from 'moholy'
import type { Signal, EncodedOutput } from 'moholy'

// --- State ---
let activeSignal: Signal | null = null
let activeEncoding: EncodedOutput | null = null
let gl: WebGLRenderingContext | null = null
let program: WebGLProgram | null = null
let animFrame: number | null = null
let lastTime = 0

// --- DOM ---
const canvas = document.getElementById('preview') as HTMLCanvasElement
const editor = document.getElementById('editor') as HTMLTextAreaElement
const runBtn = document.getElementById('runBtn') as HTMLButtonElement
const errorBanner = document.getElementById('errorBanner') as HTMLDivElement
const fpsEl = document.getElementById('fps') as HTMLDivElement
const inspectorBody = document.getElementById('inspectorBody') as HTMLDivElement
const presetBtns = document.querySelectorAll('.preset-btn') as NodeListOf<HTMLButtonElement>

// --- Presets ---
const PRESETS: Record<string, string> = {
  clock: `// Clock oscillators → color + displacement
const sig = signal.clock({ period: 3 })
const vis = encode(sig, {
  color:        { channel: 2, palette: 'spectral' },
  displacement: { channel: 3, range: [-0.4, 0.4], smooth: 0.05 },
  emission:     { channel: 4, range: [0.0, 1.5] },
})
sig.connect()
return { signal: sig, encoding: vis }`,

  audio: `// Microphone FFT → color + displacement
// (click "run" then allow mic access)
const sig = signal.audio({ fftSize: 128 })
const vis = encode(sig, {
  color:        { channel: 2, palette: 'neon', smooth: 0.3 },
  displacement: { channel: 8, range: [-0.6, 0.6], smooth: 0.15 },
  emission:     { channel: 0, range: [0.0, 2.0], smooth: 0.2 },
  opacity:      { channel: 16, range: [0.4, 1.0] },
})
sig.connect()
return { signal: sig, encoding: vis }`,

  mouse: `// Mouse position as signal
const sig = signal.array([0, 0, 0, 0])
window.__moholyMouseHandler = (e) => {
  sig.set([
    e.clientX / window.innerWidth,
    1 - e.clientY / window.innerHeight,
    Math.abs(e.movementX) / 50,
    Math.abs(e.movementY) / 50,
  ])
}
window.addEventListener('mousemove', window.__moholyMouseHandler)
const vis = encode(sig, {
  color:        { channel: 0, palette: 'ocean', smooth: 0.08 },
  displacement: { channel: 1, range: [-0.5, 0.5], smooth: 0.06 },
  emission:     { channel: 2, range: [0.0, 3.0], smooth: 0.3 },
  scale:        { channel: 3, range: [0.8, 1.2], smooth: 0.2 },
})
sig.connect()
return { signal: sig, encoding: vis }`,
}

// --- WebGL setup ---
const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() {
  vUv = position * 0.5 + 0.5;
  gl_Position = vec4(position, 0.0, 1.0);
}
`

const FRAG = `
precision mediump float;
varying vec2 vUv;
uniform float uTime;
uniform vec3 uColor;
uniform float uDisplacement;
uniform float uEmission;
uniform float uOpacity;
uniform float uScale;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x),
    u.y
  );
}

void main() {
  vec2 uv = (vUv - 0.5) * 2.0 * uScale;

  // Noise-driven displacement
  float n = noise(uv * 4.0 + uTime * 0.3);
  uv += vec2(n - 0.5) * uDisplacement;

  // Distance field — circle
  float d = length(uv);
  float circle = smoothstep(0.8, 0.75, d);

  // Rings
  float rings = sin(d * 20.0 - uTime * 2.0) * 0.5 + 0.5;
  rings = smoothstep(0.3, 0.7, rings);

  // Color with emission
  vec3 col = uColor * (0.4 + rings * 0.6);
  col += uColor * uEmission * (1.0 - d) * 0.5;

  // Vignette
  float vignette = 1.0 - d * 0.6;

  gl_FragColor = vec4(col * vignette * circle, uOpacity);
}
`

function initGL() {
  gl = canvas.getContext('webgl', { alpha: true, antialias: true })
  if (!gl) return

  resizeCanvas()

  const vs = compileShader(gl.VERTEX_SHADER, VERT)
  const fs = compileShader(gl.FRAGMENT_SHADER, FRAG)
  if (!vs || !fs) return

  program = gl.createProgram()!
  gl.attachShader(program, vs)
  gl.attachShader(program, fs)
  gl.linkProgram(program)
  gl.useProgram(program)

  // Full-screen quad
  const buf = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, buf)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW)

  const pos = gl.getAttribLocation(program, 'position')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
}

function compileShader(type: number, source: string): WebGLShader | null {
  if (!gl) return null
  const shader = gl.createShader(type)!
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error(gl.getShaderInfoLog(shader))
    return null
  }
  return shader
}

function resizeCanvas() {
  const rect = canvas.parentElement!.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  canvas.style.width = rect.width + 'px'
  canvas.style.height = rect.height + 'px'
  gl?.viewport(0, 0, canvas.width, canvas.height)
}

// --- Inspector ---
function updateInspector(sig: Signal) {
  inspectorBody.innerHTML = ''
  const count = Math.min(sig.channels, 16) // cap display at 16
  for (let i = 0; i < count; i++) {
    const ch = document.createElement('div')
    ch.className = 'channel-viz'
    ch.innerHTML = `
      <span class="channel-label">ch${i}</span>
      <div class="channel-bar-wrap">
        <div class="channel-bar" id="bar-${i}" style="height: 0%"></div>
      </div>
      <span class="channel-value" id="val-${i}">0.00</span>
    `
    inspectorBody.appendChild(ch)
  }
}

function refreshInspector(sig: Signal) {
  const count = Math.min(sig.channels, 16)
  for (let i = 0; i < count; i++) {
    const v = sig.data[i] ?? 0
    const bar = document.getElementById(`bar-${i}`)
    const val = document.getElementById(`val-${i}`)
    if (bar) bar.style.height = (v * 100) + '%'
    if (val) val.textContent = v.toFixed(2)
  }
}

// --- Render loop ---
function render(time: number) {
  const dt = lastTime === 0 ? 0.016 : (time - lastTime) / 1000
  lastTime = time

  if (activeEncoding) {
    activeEncoding.update(dt)
  }

  if (gl && program && activeEncoding) {
    gl.clearColor(0.04, 0.04, 0.05, 1)
    gl.clear(gl.COLOR_BUFFER_BIT)

    const u = activeEncoding.uniforms
    gl.uniform1f(gl.getUniformLocation(program, 'uTime'), time / 1000)
    gl.uniform3f(gl.getUniformLocation(program, 'uColor'), u.color.r, u.color.g, u.color.b)
    gl.uniform1f(gl.getUniformLocation(program, 'uDisplacement'), u.displacement)
    gl.uniform1f(gl.getUniformLocation(program, 'uEmission'), u.emission)
    gl.uniform1f(gl.getUniformLocation(program, 'uOpacity'), u.opacity)
    gl.uniform1f(gl.getUniformLocation(program, 'uScale'), u.scale)

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }

  if (activeSignal) {
    refreshInspector(activeSignal)
  }

  // FPS
  if (dt > 0) {
    fpsEl.textContent = Math.round(1 / dt) + 'fps'
  }

  animFrame = requestAnimationFrame(render)
}

// --- Run user code ---
function runCode(code: string) {
  // Cleanup previous
  cleanup()
  hideError()

  try {
    // Wrap in function that has access to signal + encode
    const fn = new Function('signal', 'encode', code)
    const result = fn(signal, encode)

    if (result && result.signal && result.encoding) {
      activeSignal = result.signal
      activeEncoding = result.encoding
      updateInspector(activeSignal!)
      lastTime = 0
      animFrame = requestAnimationFrame(render)
    } else {
      showError('Code must return { signal, encoding }')
    }
  } catch (e: unknown) {
    showError((e as Error).message)
  }
}

function cleanup() {
  if (animFrame) cancelAnimationFrame(animFrame)
  animFrame = null
  if (activeEncoding) activeEncoding.dispose()
  if (activeSignal) activeSignal.disconnect()
  activeSignal = null
  activeEncoding = null

  // Cleanup mouse handler if present
  if ((window as unknown as Record<string, unknown>).__moholyMouseHandler) {
    window.removeEventListener('mousemove', (window as unknown as Record<string, unknown>).__moholyMouseHandler as EventListener)
    delete (window as unknown as Record<string, unknown>).__moholyMouseHandler
  }
}

function showError(msg: string) {
  errorBanner.textContent = msg
  errorBanner.classList.add('visible')
}

function hideError() {
  errorBanner.classList.remove('visible')
}

// --- Events ---
runBtn.addEventListener('click', () => runCode(editor.value))

editor.addEventListener('keydown', (e) => {
  // Ctrl/Cmd + Enter to run
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault()
    runCode(editor.value)
  }
  // Tab inserts spaces
  if (e.key === 'Tab') {
    e.preventDefault()
    const start = editor.selectionStart
    editor.value = editor.value.slice(0, start) + '  ' + editor.value.slice(editor.selectionEnd)
    editor.selectionStart = editor.selectionEnd = start + 2
  }
})

presetBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    presetBtns.forEach((b) => b.classList.remove('active'))
    btn.classList.add('active')
    const preset = btn.dataset.preset!
    editor.value = PRESETS[preset] ?? ''
    runCode(editor.value)
  })
})

window.addEventListener('resize', () => {
  if (gl) resizeCanvas()
})

// --- Init ---
initGL()
editor.value = PRESETS.clock
runCode(editor.value)
