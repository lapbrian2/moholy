import { signal, encode, samplePalette, PALETTES } from 'moholy'
import type { Signal, EncodedOutput, PaletteName } from 'moholy'

// ============================================================
// WEBGL HELPERS
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
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { console.error(gl.getProgramInfoLog(prog)); return null }
  return prog
}

function compileSh(gl: WebGLRenderingContext, type: number, src: string): WebGLShader | null {
  const s = gl.createShader(type)!
  gl.shaderSource(s, src)
  gl.compileShader(s)
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) { console.error(gl.getShaderInfoLog(s)); return null }
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

function U(gl: WebGLRenderingContext, prog: WebGLProgram, names: string[]) {
  const l: Record<string, WebGLUniformLocation | null> = {}
  for (const n of names) l[n] = gl.getUniformLocation(prog, n)
  return l
}

const VERT = `
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = position * 0.5 + 0.5; gl_Position = vec4(position, 0.0, 1.0); }
`

// ============================================================
// SHARED GLSL — comprehensive noise + color from research
// ============================================================

const GLSL_CORE = `
precision highp float;
varying vec2 vUv;

// --- Hash ---
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
vec2 hash2(vec2 p) { return fract(sin(vec2(dot(p,vec2(127.1,311.7)),dot(p,vec2(269.5,183.3))))*43758.5453); }

// --- Value noise ---
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x),
             mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}

// --- FBM with rotation per octave (eliminates axis artifacts) ---
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 6; i++) { v += a * noise(p); p = rot * p * 2.0 + 100.0; a *= 0.5; }
  return v;
}

// --- Ridged FBM (sharp ridges — mountains, cracks, lightning) ---
float ridgedFBM(vec2 p) {
  float v = 0.0, a = 0.5, prev = 1.0;
  mat2 rot = mat2(0.8, 0.6, -0.6, 0.8);
  for (int i = 0; i < 5; i++) {
    float n = 1.0 - abs(noise(p) * 2.0 - 1.0);
    n = n * n * prev;
    prev = n;
    v += n * a;
    p = rot * p * 2.0 + 100.0;
    a *= 0.5;
  }
  return v;
}

// --- Worley / Voronoi (cell patterns) ---
float worley(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  float d = 1.0;
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      vec2 n = vec2(float(x), float(y));
      vec2 pt = hash2(i + n);
      d = min(d, length(n + pt - f));
    }
  }
  return d;
}

// --- Cosine palette (Quilez) ---
vec3 cosPalette(float t, vec3 a, vec3 b, vec3 c, vec3 d) {
  return a + b * cos(6.28318 * (c * t + d));
}

// --- Oklab (perceptually uniform color interpolation) ---
vec3 rgb2oklab(vec3 c) {
  float l = 0.4122*c.r + 0.5363*c.g + 0.0514*c.b;
  float m = 0.2119*c.r + 0.6807*c.g + 0.1074*c.b;
  float s = 0.0883*c.r + 0.2817*c.g + 0.6300*c.b;
  l = pow(max(l,0.0), 0.3333); m = pow(max(m,0.0), 0.3333); s = pow(max(s,0.0), 0.3333);
  return vec3(0.2105*l + 0.7936*m - 0.0041*s, 1.978*l - 2.429*m + 0.4506*s, 0.0259*l + 0.7828*m - 0.8087*s);
}

vec3 oklab2rgb(vec3 c) {
  float l = c.x + 0.3964*c.y + 0.2159*c.z;
  float m = c.x - 0.1056*c.y - 0.0639*c.z;
  float s = c.x - 0.0895*c.y - 1.2915*c.z;
  l = l*l*l; m = m*m*m; s = s*s*s;
  return vec3(4.0768*l - 3.3077*m + 0.2310*s, -1.2684*l + 2.6098*m - 0.3413*s, -0.0042*l - 0.7034*m + 1.7076*s);
}

vec3 mixOklab(vec3 a, vec3 b, float t) {
  return oklab2rgb(mix(rgb2oklab(a), rgb2oklab(b), t));
}

// --- SDF smooth min (for organic blending) ---
float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5*(b-a)/k, 0.0, 1.0);
  return mix(b, a, h) - k*h*(1.0-h);
}

// --- ACES filmic tone mapping ---
vec3 aces(vec3 x) {
  return clamp((x*(2.51*x+0.03))/(x*(2.43*x+0.59)+0.14), 0.0, 1.0);
}
`

// ============================================================
// SCROLL REVEAL (IntersectionObserver)
// ============================================================

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((e) => {
    if (e.isIntersecting) {
      e.target.classList.add('visible')
    }
  })
}, { threshold: 0.15 })

document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el))

// ============================================================
// GLOBAL STATE
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

globalPeriodInput?.addEventListener('input', () => { globalPeriod = parseFloat(globalPeriodInput.value); globalPeriodVal.textContent = globalPeriod.toFixed(1) + 's' })
globalPaletteInput?.addEventListener('change', () => { globalPalette = globalPaletteInput.value as PaletteName })
globalSmoothInput?.addEventListener('input', () => { globalSmooth = parseFloat(globalSmoothInput.value) / 100; globalSmoothVal.textContent = globalSmooth.toFixed(2) })

const heroObs = new IntersectionObserver(([entry]) => {
  globalPanel.classList.toggle('visible', !entry.isIntersecting)
}, { threshold: 0.3 })
const heroEl = document.querySelector('.hero')
if (heroEl) heroObs.observe(heroEl)

// ============================================================
// OSCILLOSCOPE — Canvas 2D waveform (signal-green on dark grid)
// ============================================================

function drawScope(canvas: HTMLCanvasElement, data: Float32Array, n: number) {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const rect = canvas.parentElement!.getBoundingClientRect()
  const dpr = Math.min(window.devicePixelRatio, 2)
  canvas.width = rect.width * dpr
  canvas.height = rect.height * dpr
  const w = canvas.width, h = canvas.height

  ctx.fillStyle = '#0c0c0e'
  ctx.fillRect(0, 0, w, h)

  // Grid
  ctx.strokeStyle = 'rgba(255,255,255,0.03)'
  ctx.lineWidth = 1
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(0, h * i / 4); ctx.lineTo(w, h * i / 4); ctx.stroke() }
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.beginPath(); ctx.moveTo(0, h / 2); ctx.lineTo(w, h / 2); ctx.stroke()

  // Waveform glow (double-pass for glow effect)
  const step = w / (n - 1)
  for (let pass = 0; pass < 2; pass++) {
    ctx.strokeStyle = pass === 0 ? 'rgba(0,230,118,0.15)' : '#00e676'
    ctx.lineWidth = pass === 0 ? 6 * dpr : 1.5 * dpr
    ctx.beginPath()
    for (let i = 0; i < n; i++) {
      const x = i * step, y = h - data[i] * h
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y)
    }
    ctx.stroke()
  }
}

// ============================================================
// HERO — raymarched 3D SDF scene: orbiting geometry with
// domain-warped materials, 3-point lighting, AO, rim glow
// ============================================================

;(function initHero() {
  const canvas = document.getElementById('heroGL') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = GLSL_CORE + `
  uniform float uTime;
  uniform vec2 uRes;

  // --- SDF primitives ---
  float sdSphere(vec3 p, float r) { return length(p) - r; }
  float sdTorus(vec3 p, vec2 t) { vec2 q = vec2(length(p.xz)-t.x, p.y); return length(q)-t.y; }
  float sdBox(vec3 p, vec3 b) { vec3 q = abs(p)-b; return length(max(q,0.0))+min(max(q.x,max(q.y,q.z)),0.0); }
  float sdOctahedron(vec3 p, float s) { p = abs(p); return (p.x+p.y+p.z-s)*0.57735; }

  // --- Rotation ---
  mat2 rot(float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

  // --- Scene SDF ---
  float scene(vec3 p) {
    float t = uTime * 0.25;

    // Central sphere with noise displacement
    vec3 p1 = p;
    float nDisp = fbm(p1.xy * 2.0 + t * 0.3) * 0.15;
    float sphere = sdSphere(p1, 0.8 + nDisp);

    // Orbiting torus
    vec3 p2 = p;
    p2.xz *= rot(t * 0.6);
    p2.xy *= rot(t * 0.3);
    float torus = sdTorus(p2, vec2(1.3, 0.08));

    // Second torus at different angle
    vec3 p3 = p;
    p3.xz *= rot(t * 0.4 + 1.5);
    p3.yz *= rot(t * 0.5 + 0.8);
    float torus2 = sdTorus(p3, vec2(1.5, 0.06));

    // Floating octahedron
    vec3 p4 = p - vec3(sin(t*0.7)*1.8, cos(t*0.5)*0.6, sin(t*0.6+1.0)*1.2);
    p4.xy *= rot(t * 0.8);
    p4.yz *= rot(t * 0.6);
    float octa = sdOctahedron(p4, 0.35);

    // Small orbiting spheres
    float orbs = 1e5;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float angle = fi * 1.2566 + t * (0.3 + fi * 0.08);
      float r = 2.0 + sin(t * 0.3 + fi) * 0.3;
      float h = sin(t * 0.4 + fi * 0.7) * 0.5;
      vec3 op = p - vec3(cos(angle)*r, h, sin(angle)*r);
      orbs = min(orbs, sdSphere(op, 0.1 + fi * 0.02));
    }

    // Blend sphere and tori smoothly
    float d = smin(sphere, torus, 0.3);
    d = smin(d, torus2, 0.2);
    d = min(d, octa);
    d = min(d, orbs);

    return d;
  }

  // --- Normal via central differences ---
  vec3 calcNormal(vec3 p) {
    vec2 e = vec2(0.001, 0.0);
    return normalize(vec3(scene(p+e.xyy)-scene(p-e.xyy),
                          scene(p+e.yxy)-scene(p-e.yxy),
                          scene(p+e.yyx)-scene(p-e.yyx)));
  }

  // --- Ambient occlusion ---
  float calcAO(vec3 p, vec3 n) {
    float ao = 0.0;
    float scale = 1.0;
    for (int i = 0; i < 5; i++) {
      float dist = 0.02 + 0.12 * float(i);
      float d = scene(p + n * dist);
      ao += (dist - d) * scale;
      scale *= 0.6;
    }
    return clamp(1.0 - ao * 3.0, 0.0, 1.0);
  }

  // --- Raymarching ---
  float march(vec3 ro, vec3 rd) {
    float t = 0.0;
    for (int i = 0; i < 80; i++) {
      float d = scene(ro + rd * t);
      if (d < 0.001) break;
      t += d;
      if (t > 20.0) break;
    }
    return t;
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

    // Camera: slow orbit
    float camT = uTime * 0.08;
    vec3 ro = vec3(sin(camT)*4.0, 1.5 + sin(camT*0.5)*0.5, cos(camT)*4.0);
    vec3 ta = vec3(0.0, 0.0, 0.0);
    vec3 ww = normalize(ta - ro);
    vec3 uu = normalize(cross(ww, vec3(0,1,0)));
    vec3 vv = cross(uu, ww);
    vec3 rd = normalize(uv.x*uu + uv.y*vv + 1.8*ww);

    // Background gradient
    vec3 bgTop = vec3(0.04, 0.035, 0.05);
    vec3 bgBot = vec3(0.02, 0.02, 0.025);
    vec3 bg = mix(bgBot, bgTop, vUv.y);

    float t = march(ro, rd);

    vec3 col = bg;

    if (t < 20.0) {
      vec3 p = ro + rd * t;
      vec3 n = calcNormal(p);
      float ao = calcAO(p, n);

      // 3-point lighting
      vec3 keyDir = normalize(vec3(2.0, 3.0, 1.0));
      vec3 fillDir = normalize(vec3(-1.0, 1.0, -2.0));
      vec3 rimDir = normalize(vec3(0.0, 1.0, -3.0));

      float key = max(dot(n, keyDir), 0.0);
      float fill = max(dot(n, fillDir), 0.0) * 0.3;
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0); // Fresnel rim

      // Material: domain-warped noise for color variation
      float matN = fbm(p.xy * 1.5 + p.z * 0.5 + uTime * 0.05);
      vec3 matColor = cosPalette(matN,
        vec3(0.15, 0.12, 0.08),
        vec3(0.2, 0.15, 0.1),
        vec3(1.0, 0.7, 0.4),
        vec3(0.0, 0.1, 0.2)
      );

      // Cool tones in shadow
      vec3 shadowColor = vec3(0.04, 0.05, 0.08);

      col = matColor * key * 1.2;
      col += matColor * fill;
      col += vec3(0.8, 0.65, 0.4) * rim * 0.35; // gold rim
      col = mix(shadowColor, col, ao);

      // Specular
      vec3 halfDir = normalize(keyDir - rd);
      float spec = pow(max(dot(n, halfDir), 0.0), 32.0);
      col += vec3(0.9, 0.8, 0.6) * spec * 0.4;

      // Fog
      float fog = 1.0 - exp(-t * 0.08);
      col = mix(col, bg, fog);
    }

    // Small star particles in background
    float stars = smoothstep(0.98, 1.0, hash(floor(vUv * 300.0)));
    col += vec3(0.4, 0.35, 0.25) * stars * (1.0 - step(20.0, t));

    // Grain
    col += (hash(vUv * uRes + fract(uTime)) - 0.5) * 0.012;

    // Vignette
    vec2 vc = (vUv - 0.5) * 2.0;
    col *= 1.0 - dot(vc, vc) * 0.15;

    col = aces(col * 1.1);
    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog); setupQuad(gl, prog)
  const u = U(gl, prog, ['uTime', 'uRes'])

  function render(t: number) {
    gl!.uniform1f(u.uTime, t / 1000); gl!.uniform2f(u.uRes, canvas.width, canvas.height)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
  window.addEventListener('resize', () => sizeCanvas(canvas, gl!))
})()

// ============================================================
// PALETTE STRIPS — animated sweep indicator
// ============================================================

;(function initPalettes() {
  const container = document.getElementById('paletteStrips')
  if (!container) return
  const names: PaletteName[] = ['thermal', 'ocean', 'neon', 'monochrome', 'spectral']
  for (const name of names) {
    const row = document.createElement('div'); row.className = 'palette-row'
    const label = document.createElement('span'); label.className = 'palette-label'; label.textContent = name
    const strip = document.createElement('canvas'); strip.className = 'palette-strip'; strip.width = 512; strip.height = 32
    const ctx = strip.getContext('2d')!
    for (let x = 0; x < 512; x++) {
      const t = x / 511, rgb = samplePalette(name, t)
      ctx.fillStyle = `rgb(${rgb.r*255|0},${rgb.g*255|0},${rgb.b*255|0})`
      ctx.fillRect(x, 0, 1, 32)
    }
    row.appendChild(label); row.appendChild(strip); container.appendChild(row)
  }
})()

// ============================================================
// I. SIGNALS — Worley + FBM layered visualization
// ============================================================

;(function initSignalDemo() {
  const canvas = document.getElementById('signalDemo') as HTMLCanvasElement
  const scopeCanvas = document.getElementById('signalScope') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 3 })
  sig.connect()

  const frag = GLSL_CORE + `
  uniform float uTime;
  uniform float uChannels[6];

  void main() {
    vec2 uv = vUv;
    float band = floor(uv.x * 6.0);
    float bandFrac = fract(uv.x * 6.0);
    float value = 0.0;
    for (int i = 0; i < 6; i++) {
      if (float(i) == band) value = uChannels[i];
    }

    float bar = smoothstep(1.0 - value - 0.01, 1.0 - value, uv.y);
    bar *= smoothstep(0.0, 0.05, bandFrac) * smoothstep(1.0, 0.95, bandFrac);

    // Noise texture on bars for depth
    float n = fbm(vec2(bandFrac * 3.0, uv.y * 8.0) + uTime * 0.3);

    // Color: gradient from deep gold at bottom to bright at top
    vec3 barColor = mixOklab(
      vec3(0.4, 0.3, 0.1),
      vec3(0.95, 0.8, 0.5),
      uv.y * value
    );
    barColor += n * 0.06;

    vec3 bg = vec3(0.04, 0.04, 0.05);

    // Subtle grid
    float gridX = smoothstep(0.01, 0.0, abs(bandFrac - 0.5) - 0.49);
    float gridY = smoothstep(0.01, 0.0, abs(fract(uv.y * 10.0) - 0.5) - 0.49);
    bg += vec3(0.03) * max(gridX, gridY);

    vec3 col = mix(bg, barColor, bar * (1.0 - bar * 0.3));

    // Glow at bar edge
    float edgeDist = abs(uv.y - (1.0 - value));
    float glow = exp(-edgeDist * 30.0) * value * 0.3;
    col += vec3(0.9, 0.7, 0.3) * glow;

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog); setupQuad(gl, prog)
  const u = U(gl, prog, ['uTime', 'uChannels'])

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000; last = t
    sig.update(dt)
    gl!.uniform1f(u.uTime, t / 1000); gl!.uniform1fv(u.uChannels, sig.data)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    drawScope(scopeCanvas, sig.data, 6)
    if (dt > 0) panelFps.textContent = Math.round(1 / dt) + 'fps'
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// II. ENCODINGS — morphing metaball field with iridescent color
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

  const frag = GLSL_CORE + `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;
  uniform vec2 uRes;

  // --- Raymarched 3D metaballs ---
  mat2 rot(float a) { float c=cos(a),s=sin(a); return mat2(c,-s,s,c); }

  float metaScene(vec3 p) {
    float t = uTime * 0.35;

    // 4 orbiting blobs — smooth union
    vec3 p1 = p - vec3(sin(t*0.7)*0.5, cos(t*0.9)*0.4, sin(t*0.5)*0.3);
    vec3 p2 = p - vec3(sin(t*1.1+2.0)*0.4, cos(t*0.8+1.0)*0.5, cos(t*0.7+2.0)*0.3);
    vec3 p3 = p - vec3(sin(t*0.6+4.0)*0.45, cos(t*1.2+3.0)*0.3, sin(t*0.9+1.5)*0.4);
    vec3 p4 = p - vec3(cos(t*0.5)*0.3, sin(t*0.7+2.5)*0.4, cos(t*1.0+0.5)*0.5);

    // Noise displacement on surface
    float n = fbm(p.xy * 3.0 + uTime * 0.1) * uDisplacement * 0.5;

    float d1 = length(p1) - 0.35 + n;
    float d2 = length(p2) - 0.3 + n;
    float d3 = length(p3) - 0.32 + n;
    float d4 = length(p4) - 0.28 + n;

    float d = smin(smin(d1, d2, 0.5), smin(d3, d4, 0.5), 0.5);
    return d;
  }

  vec3 metaNormal(vec3 p) {
    vec2 e = vec2(0.002, 0.0);
    return normalize(vec3(metaScene(p+e.xyy)-metaScene(p-e.xyy),
                          metaScene(p+e.yxy)-metaScene(p-e.yxy),
                          metaScene(p+e.yyx)-metaScene(p-e.yyx)));
  }

  float metaAO(vec3 p, vec3 n) {
    float ao = 0.0, s = 1.0;
    for (int i = 0; i < 5; i++) {
      float d = 0.02 + 0.1*float(i);
      ao += (d - metaScene(p + n*d)) * s;
      s *= 0.6;
    }
    return clamp(1.0 - ao*3.0, 0.0, 1.0);
  }

  void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / min(uRes.x, uRes.y);

    // Camera
    float camA = uTime * 0.1;
    vec3 ro = vec3(sin(camA)*2.8, 0.8, cos(camA)*2.8);
    vec3 ta = vec3(0.0);
    vec3 ww = normalize(ta-ro);
    vec3 uu = normalize(cross(ww, vec3(0,1,0)));
    vec3 vv = cross(uu, ww);
    vec3 rd = normalize(uv.x*uu + uv.y*vv + 2.0*ww);

    vec3 bg = mix(vec3(0.025,0.025,0.035), vec3(0.04,0.035,0.05), vUv.y);

    // March
    float t = 0.0;
    for (int i = 0; i < 64; i++) {
      float d = metaScene(ro + rd * t);
      if (d < 0.001) break;
      t += d;
      if (t > 15.0) break;
    }

    vec3 col = bg;

    if (t < 15.0) {
      vec3 p = ro + rd * t;
      vec3 n = metaNormal(p);
      float ao = metaAO(p, n);

      // Lighting
      vec3 keyDir = normalize(vec3(1.5, 2.0, 1.0));
      float key = max(dot(n, keyDir), 0.0);
      float fill = max(dot(n, normalize(vec3(-1,0.5,-1))), 0.0) * 0.25;
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 4.0);

      // Material color from moholy encoding
      float matN = fbm(p.xy * 2.0 + p.z + uTime * 0.08);
      vec3 matColor = mixOklab(uColor, uColor * 1.4, matN);

      col = matColor * key * 1.3;
      col += matColor * fill;
      col += uColor * rim * 0.4 * uEmission;
      col = mix(vec3(0.03,0.03,0.05), col, ao);

      // Specular
      vec3 h = normalize(keyDir - rd);
      col += vec3(0.9,0.85,0.7) * pow(max(dot(n,h),0.0), 48.0) * 0.5;

      // Emission glow
      col += uColor * uEmission * rim * 0.3;

      // Fog
      col = mix(col, bg, 1.0 - exp(-t*0.1));
    }

    // Outer glow halo
    float centerDist = length(vUv - 0.5);
    if (t >= 15.0) {
      col += uColor * exp(-centerDist * 4.0) * uEmission * 0.08;
    }

    col += (hash(vUv*500.0+fract(uTime))-0.5)*0.008;
    gl_FragColor = vec4(aces(col * 1.1), 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog); setupQuad(gl, prog)
  const u = U(gl, prog, ['uTime', 'uColor', 'uDisplacement', 'uEmission', 'uRes'])

  const paletteSelect = document.getElementById('paletteSelect') as HTMLSelectElement
  const displaceRange = document.getElementById('displaceRange') as HTMLInputElement
  const emissionRange = document.getElementById('emissionRange') as HTMLInputElement

  paletteSelect?.addEventListener('change', () => {
    vis.dispose()
    vis = encode(sig, {
      color: { channel: 2, palette: paletteSelect.value as PaletteName },
      displacement: { channel: 3, range: [-parseFloat(displaceRange.value)/100, parseFloat(displaceRange.value)/100], smooth: 0.05 },
      emission: { channel: 4, range: [0, (parseFloat(emissionRange.value)/100)*3] },
    })
    sig.connect()
  })

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000; last = t
    vis.update(dt)
    const c = vis.uniforms
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.uniform3f(u.uColor, c.color.r, c.color.g, c.color.b)
    gl!.uniform1f(u.uDisplacement, c.displacement)
    gl!.uniform1f(u.uEmission, c.emission)
    gl!.uniform2f(u.uRes, canvas.width, canvas.height)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
  window.addEventListener('resize', () => sizeCanvas(canvas, gl!))
})()

// ============================================================
// IV. TRANSFORMS — dual waveform with glow trails
// ============================================================

;(function initTransformDemo() {
  const canvas = document.getElementById('transformDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const sig = signal.clock({ period: 2 })
  const rawEnc = encode(sig, { displacement: { channel: 4, range: [0, 1] } })
  const smoothEnc = encode(sig, { displacement: { channel: 4, range: [0, 1], smooth: 0.85 } })
  sig.connect()

  const frag = GLSL_CORE + `
  uniform float uRaw;
  uniform float uSmooth;
  uniform float uTime;

  void main() {
    vec3 bg = vec3(0.03, 0.03, 0.04);

    // Grid
    float gridY = smoothstep(0.005, 0.0, abs(fract(vUv.y * 8.0) - 0.5) - 0.495);
    float gridCenter = smoothstep(0.002, 0.0, abs(vUv.x - 0.5));
    bg += vec3(0.03) * gridY + vec3(0.06) * gridCenter;

    // Left: raw — sharp, angular
    float rawY = 1.0 - uRaw;
    float rawDist = abs(vUv.y - rawY);
    float rawLine = smoothstep(0.008, 0.0, rawDist) * step(vUv.x, 0.49);
    float rawGlow = exp(-rawDist * 40.0) * step(vUv.x, 0.49) * 0.3;

    // Right: smooth — flowing, organic
    float smoothY = 1.0 - uSmooth;
    float smoothDist = abs(vUv.y - smoothY);
    float smoothLine = smoothstep(0.008, 0.0, smoothDist) * step(0.51, vUv.x);
    float smoothGlow = exp(-smoothDist * 30.0) * step(0.51, vUv.x) * 0.4;

    // Fill beneath lines
    float rawFill = smoothstep(rawY + 0.01, rawY, vUv.y) * step(vUv.x, 0.49) * 0.06;
    float smoothFill = smoothstep(smoothY + 0.01, smoothY, vUv.y) * step(0.51, vUv.x) * 0.1;

    vec3 rawColor = vec3(0.5, 0.35, 0.15);
    vec3 smoothColor = vec3(0.9, 0.75, 0.4);

    vec3 col = bg;
    col += rawColor * rawFill;
    col += smoothColor * smoothFill;
    col += rawColor * rawGlow;
    col += smoothColor * smoothGlow;
    col += rawColor * rawLine * 0.8;
    col += smoothColor * smoothLine;

    gl_FragColor = vec4(col, 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog); setupQuad(gl, prog)
  const u = U(gl, prog, ['uRaw', 'uSmooth', 'uTime'])

  let last = 0
  function render(t: number) {
    const dt = last === 0 ? 0.016 : (t - last) / 1000; last = t
    rawEnc.update(dt); smoothEnc.update(dt)
    gl!.uniform1f(u.uRaw, rawEnc.uniforms.displacement)
    gl!.uniform1f(u.uSmooth, smoothEnc.uniforms.displacement)
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// V. NOISE — domain-warped topographic map with elevation color
// ============================================================

;(function initNoiseDemo() {
  const canvas = document.getElementById('noiseDemo') as HTMLCanvasElement
  const gl = createGL(canvas)
  if (!gl) return

  const frag = GLSL_CORE + `
  uniform float uTime;

  void main() {
    vec2 uv = vUv * 4.0;
    float t = uTime * 0.08;

    // Double domain warp
    vec2 q = vec2(fbm(uv + t), fbm(uv + vec2(5.2, 1.3) + t * 0.6));
    vec2 r = vec2(fbm(uv + 3.5*q + vec2(1.7, 9.2)), fbm(uv + 3.5*q + vec2(8.3, 2.8)));
    float n = fbm(uv + 3.5*r);

    // Ridged overlay for peaks
    float peaks = ridgedFBM(uv * 1.5 + 2.0*q + t * 0.1);

    // Topographic contour lines (10 contours)
    float contour = fract(n * 12.0);
    float line = smoothstep(0.0, 0.025, contour) * smoothstep(0.05, 0.025, contour);

    // Major contour lines (every 5th)
    float majorContour = fract(n * 2.4);
    float majorLine = smoothstep(0.0, 0.015, majorContour) * smoothstep(0.03, 0.015, majorContour);

    // Elevation coloring via cosine palette
    vec3 elevation = cosPalette(n,
      vec3(0.02, 0.03, 0.04),
      vec3(0.08, 0.07, 0.05),
      vec3(0.8, 0.7, 0.5),
      vec3(0.0, 0.15, 0.3)
    );

    // Peak highlights
    elevation += vec3(0.12, 0.09, 0.03) * smoothstep(0.5, 0.8, peaks);

    // Contour lines
    vec3 lineColor = vec3(0.6, 0.5, 0.3);
    vec3 majorLineColor = vec3(0.8, 0.65, 0.4);

    vec3 col = elevation;
    col = mix(col, lineColor * 0.5, line * 0.5);
    col = mix(col, majorLineColor * 0.6, majorLine * 0.6);

    // Subtle Worley cells for rock texture
    float rock = worley(uv * 8.0 + t * 0.2);
    col += vec3(0.015) * smoothstep(0.4, 0.0, rock) * (1.0 - n);

    // Grain
    col += (hash(vUv * 800.0 + fract(uTime)) - 0.5) * 0.008;

    gl_FragColor = vec4(aces(col * 1.1), 1.0);
  }
  `

  const prog = compileProgram(gl, VERT, frag)
  if (!prog) return
  gl.useProgram(prog); setupQuad(gl, prog)
  const u = U(gl, prog, ['uTime'])

  function render(t: number) {
    gl!.uniform1f(u.uTime, t / 1000)
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4)
    requestAnimationFrame(render)
  }
  requestAnimationFrame(render)
})()

// ============================================================
// VI. PLAYGROUND
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

  const FRAG = GLSL_CORE + `
  uniform float uTime;
  uniform vec3 uColor;
  uniform float uDisplacement;
  uniform float uEmission;
  uniform float uOpacity;
  uniform float uScale;

  void main() {
    vec2 uv = (vUv - 0.5) * 2.0 * uScale;
    float n = fbm(uv * 2.5 + uTime * 0.15);
    uv += vec2(n - 0.5) * uDisplacement;

    float t = uTime * 0.35;
    vec2 p1 = vec2(sin(t*0.7)*0.3, cos(t*0.9)*0.25);
    vec2 p2 = vec2(sin(t*1.1+2.0)*0.28, cos(t*0.8+1.0)*0.32);
    vec2 p3 = vec2(sin(t*0.6+4.0)*0.25, cos(t*1.2+3.0)*0.3);

    float d = smin(smin(length(uv-p1)-0.28, length(uv-p2)-0.24, 0.35), length(uv-p3)-0.26, 0.35);
    float shape = smoothstep(0.02, -0.02, d);
    float glow = exp(-max(d,0.0)*6.0) * uEmission;

    float interior = ridgedFBM(uv * 3.0 + uTime * 0.1) * shape;
    vec3 col = uColor * (0.35 + interior * 0.65);
    col += uColor * glow * 0.4;
    col += vec3(1.0) * smoothstep(0.25,0.0,length(uv)) * shape * uEmission * 0.06;

    vec3 bg = vec3(0.03, 0.03, 0.04);
    col = mix(bg, col, shape + glow * 0.25);
    col += (hash(vUv*500.0+fract(uTime))-0.5)*0.008;

    gl_FragColor = vec4(aces(col), uOpacity);
  }
  `

  program = compileProgram(gl, VERT, FRAG)
  if (!program) return
  gl.useProgram(program); setupQuad(gl, program)
  const uLocs = U(gl, program, ['uTime','uColor','uDisplacement','uEmission','uOpacity','uScale'])

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
    if (animFrame) cancelAnimationFrame(animFrame); animFrame = null
    if (activeEnc) activeEnc.dispose(); if (activeSig) activeSig.disconnect()
    activeSig = null; activeEnc = null
    if ((window as any).__mh) { removeEventListener('mousemove', (window as any).__mh); delete (window as any).__mh }
  }

  function runCode(code: string) {
    cleanup(); errorBanner.classList.remove('visible')
    try {
      const result = new Function('signal', 'encode', code)(signal, encode)
      if (result?.signal && result?.encoding) {
        activeSig = result.signal; activeEnc = result.encoding; lastTime = 0
        animFrame = requestAnimationFrame(render)
      } else showError('Must return { signal, encoding }')
    } catch (e: any) { showError(e.message) }
  }

  function showError(msg: string) { errorBanner.textContent = msg; errorBanner.classList.add('visible') }

  function render(t: number) {
    const dt = lastTime === 0 ? 0.016 : (t - lastTime) / 1000; lastTime = t
    if (activeEnc) activeEnc.update(dt)
    if (gl && program && activeEnc) {
      gl.clearColor(0.03, 0.03, 0.04, 1); gl.clear(gl.COLOR_BUFFER_BIT)
      const c = activeEnc.uniforms
      gl.uniform1f(uLocs.uTime, t/1000)
      gl.uniform3f(uLocs.uColor, c.color.r, c.color.g, c.color.b)
      gl.uniform1f(uLocs.uDisplacement, c.displacement)
      gl.uniform1f(uLocs.uEmission, c.emission)
      gl.uniform1f(uLocs.uOpacity, c.opacity)
      gl.uniform1f(uLocs.uScale, c.scale)
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
    }
    if (activeSig) drawScope(scopeCanvas, activeSig.data, Math.min(activeSig.channels, 16))
    if (dt > 0) fpsEl.textContent = Math.round(1/dt) + 'fps'
    animFrame = requestAnimationFrame(render)
  }

  runBtn.addEventListener('click', () => runCode(editor.value))
  editor.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') { e.preventDefault(); runCode(editor.value) }
    if (e.key === 'Tab') { e.preventDefault(); const s = editor.selectionStart; editor.value = editor.value.slice(0,s)+'  '+editor.value.slice(editor.selectionEnd); editor.selectionStart = editor.selectionEnd = s+2 }
  })
  document.querySelectorAll('.preset-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      editor.value = PRESETS[(btn as HTMLElement).dataset.preset!] ?? ''
      runCode(editor.value)
    })
  })
  editor.value = PRESETS.clock; runCode(editor.value)
})()

// ============================================================
// RESIZE
// ============================================================
window.addEventListener('resize', () => {
  document.querySelectorAll('.demo-wrap canvas, .hero-canvas canvas').forEach((c) => {
    const gl = (c as HTMLCanvasElement).getContext('webgl')
    if (gl) sizeCanvas(c as HTMLCanvasElement, gl)
  })
})
