<template>
  <div>
    <!-- HERO -->
    <section class="hero">
      <ClientOnly>
        <div class="hero-canvas">
          <TresCanvas :clear-color="'#0c0c0e'">
            <TresPerspectiveCamera :position="[0, 1.5, 5]" :fov="45" />
            <HeroScene />
          </TresCanvas>
        </div>
        <template #fallback>
          <div class="hero-canvas" style="background: var(--bg-deep);" />
        </template>
      </ClientOnly>
      <div class="hero-content">
        <h1>moholy<span class="dot">.</span>js<span class="version">0.1.0</span></h1>
        <p class="tagline">A tiny library that maps real-time data signals<br>to shader visual parameters. Zero dependencies.</p>
        <div class="meta">
          <a href="https://github.com/lapbrian2/moholy" target="_blank">github</a>
          <span>4.67 KB gzipped</span>
          <span>MIT license</span>
        </div>
      </div>
    </section>

    <!-- FEATURES -->
    <div class="features">
      <div class="feature reveal">
        <span class="feature-symbol">~</span>
        <h3>Signal Sources</h3>
        <p>Audio FFT, WebSocket, fetch polling, device sensors, time oscillators, manual arrays. Six ways to pipe data in.</p>
      </div>
      <div class="feature reveal reveal-delay-1">
        <span class="feature-symbol">=</span>
        <h3>Visual Encodings</h3>
        <p>Map signal channels to color, displacement, opacity, emission, speed, scale. Smooth, threshold, invert, ease.</p>
      </div>
      <div class="feature reveal reveal-delay-2">
        <span class="feature-symbol">#</span>
        <h3>GLSL Chunks</h3>
        <p>Drop-in shader functions for palette sampling, vertex displacement, emissive glow, and GPU noise.</p>
      </div>
    </div>

    <!-- TOC -->
    <div class="toc">
      <div class="toc-intro">
        <p>moholy.js is a minimalist signal-to-shader pipeline. It connects any source of numbers to the visual parameters of a WebGL shader.</p>
        <p>The library handles normalization, smoothing, palette lookup, and output formatting. You handle the rendering.</p>
        <p>Named after <a href="https://en.wikipedia.org/wiki/L%C3%A1szl%C3%B3_Moholy-Nagy" target="_blank">Laszlo Moholy-Nagy</a> (1895-1946), who built the Light-Space Modulator — a machine that transformed light signals into kinetic visual patterns.</p>
      </div>
      <ul class="toc-list">
        <li><span class="num">I.</span> <span class="title">Signals</span></li>
        <li><span class="num">II.</span> <span class="title">Encodings</span></li>
        <li><span class="num">III.</span> <span class="title">Palettes</span></li>
        <li><span class="num">IV.</span> <span class="title">Transforms</span></li>
        <li><span class="num">V.</span> <span class="title">GLSL Chunks</span></li>
        <li><span class="num">VI.</span> <span class="title">Playground</span></li>
      </ul>
    </div>

    <!-- SECTION I: SIGNALS -->
    <section class="section" id="signals">
      <span class="section-number">I.</span>
      <h2>Signals</h2>
      <div class="section-body">
        <div class="section-text">
          <p>A signal is a source of numbers that change over time. Each signal exposes a <code>Float32Array</code> of channel values, normalized to 0-1.</p>
          <p>Six built-in sources ship with moholy. All share the same interface: <code>.connect()</code>, <code>.disconnect()</code>, <code>.update(dt)</code>.</p>
          <table class="api-table">
            <thead><tr><th>Source</th><th>Constructor</th><th>Channels</th></tr></thead>
            <tbody>
              <tr><td>Audio</td><td><code>signal.audio()</code></td><td>FFT bins</td></tr>
              <tr><td>WebSocket</td><td><code>signal.websocket(url)</code></td><td>Parsed values</td></tr>
              <tr><td>Fetch</td><td><code>signal.fetch(url)</code></td><td>Polled JSON</td></tr>
              <tr><td>Array</td><td><code>signal.array(data)</code></td><td>Manual</td></tr>
              <tr><td>Device</td><td><code>signal.device()</code></td><td>Gyro + Accel</td></tr>
              <tr><td>Clock</td><td><code>signal.clock()</code></td><td>Oscillators</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <ClientOnly>
            <div class="demo-wrap" style="aspect-ratio: 1;">
              <TresCanvas :clear-color="'#0c0c0e'">
                <TresPerspectiveCamera :position="[0, 2, 4]" :fov="50" />
                <SignalBarsScene />
              </TresCanvas>
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- SECTION II: ENCODINGS -->
    <section class="section" id="encodings">
      <span class="section-number">II.</span>
      <h2>Encodings</h2>
      <div class="section-body">
        <div class="section-text">
          <p>An encoding maps a signal channel to a visual dimension. You declare what each channel controls — color, displacement, opacity, emission — and moholy handles the math.</p>
          <p>The output is plain numbers and RGB values. Plug them into any shader uniform, any material property, any animation parameter.</p>
          <div class="code-block"><span class="kw">const</span> vis = <span class="fn">encode</span>(sig, {
  <span class="str">color</span>:        { channel: <span class="num">2</span>, palette: <span class="str">'spectral'</span> },
  <span class="str">displacement</span>: { channel: <span class="num">3</span>, range: [<span class="num">-0.4</span>, <span class="num">0.4</span>] },
  <span class="str">emission</span>:     { channel: <span class="num">4</span>, range: [<span class="num">0</span>, <span class="num">1.5</span>] },
})</div>
        </div>
        <div>
          <ClientOnly>
            <div class="demo-wrap" style="aspect-ratio: 1;">
              <TresCanvas :clear-color="'#0c0c0e'">
                <TresPerspectiveCamera :position="[0, 0.5, 3.5]" :fov="45" />
                <EncodingsScene color="#c9a86c" :emission="0.6" />
              </TresCanvas>
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- SECTION III: PALETTES -->
    <section class="section" id="palettes">
      <span class="section-number">III.</span>
      <h2>Palettes</h2>
      <div class="section-body">
        <div class="section-text">
          <p>Five built-in palettes map a 0-1 value to a color. Pass a palette name or your own array of hex strings.</p>
          <p>Palette sampling is continuous — moholy interpolates between color stops. The result is smooth gradients across the full range.</p>
          <div class="code-block"><span class="cmt">// Built-in</span>
{ palette: <span class="str">'thermal'</span> }

<span class="cmt">// Custom</span>
{ palette: [<span class="str">'#000'</span>, <span class="str">'#ff0066'</span>, <span class="str">'#00ffcc'</span>, <span class="str">'#fff'</span>] }</div>
        </div>
        <div class="palette-display">
          <div v-for="name in ['thermal', 'ocean', 'neon', 'monochrome', 'spectral']" :key="name" class="palette-row">
            <span class="palette-label">{{ name }}</span>
            <div class="palette-gradient" :style="{ background: paletteGradient(name) }" />
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION IV: TRANSFORMS -->
    <section class="section" id="transforms">
      <span class="section-number">IV.</span>
      <h2>Transforms</h2>
      <div class="section-body">
        <div class="section-text">
          <p>Transforms modify the signal value before it reaches the visual output. They compose: smooth the raw data, threshold it, apply an easing curve, then remap the range.</p>
          <table class="api-table">
            <thead><tr><th>Transform</th><th>Effect</th></tr></thead>
            <tbody>
              <tr><td><code>smooth: 0.1</code></td><td>Exponential moving average. Higher = more lag.</td></tr>
              <tr><td><code>threshold: 0.4</code></td><td>Values below cutoff become 0.</td></tr>
              <tr><td><code>invert: true</code></td><td>Flip: 1 - value.</td></tr>
              <tr><td><code>curve: 'ease-in'</code></td><td>Easing: linear, ease-in, ease-out, ease-in-out.</td></tr>
              <tr><td><code>range: [-0.5, 0.5]</code></td><td>Remap 0-1 to any output range.</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <div class="transform-visual">
            <div class="transform-label">raw</div>
            <div class="transform-bar" :style="{ height: rawVal * 100 + '%' }" />
            <div class="transform-label">smooth</div>
            <div class="transform-bar smooth" :style="{ height: smoothVal * 100 + '%' }" />
          </div>
        </div>
      </div>
    </section>

    <!-- SECTION V: GLSL CHUNKS -->
    <section class="section" id="glsl">
      <span class="section-number">V.</span>
      <h2>GLSL Chunks</h2>
      <div class="section-body">
        <div class="section-text">
          <p>Four optional shader function libraries. Import as strings, concatenate into your shader source. Each chunk is self-contained.</p>
          <table class="api-table">
            <thead><tr><th>Chunk</th><th>Functions</th></tr></thead>
            <tbody>
              <tr><td><code>glsl.color</code></td><td>moholyColor(), moholyColorBlend()</td></tr>
              <tr><td><code>glsl.displace</code></td><td>moholyDisplace(), moholyDisplaceNoisy()</td></tr>
              <tr><td><code>glsl.emission</code></td><td>moholyEmission(), moholyRimEmission()</td></tr>
              <tr><td><code>glsl.noise</code></td><td>moholyNoise2D(), moholyNoise3D(), moholyFBM()</td></tr>
            </tbody>
          </table>
        </div>
        <div>
          <ClientOnly>
            <div class="demo-wrap" style="aspect-ratio: 1;">
              <TresCanvas :clear-color="'#0c0c0e'">
                <TresPerspectiveCamera :position="[0, 2, 3]" :fov="50" />
                <NoiseTerrainScene />
              </TresCanvas>
            </div>
          </ClientOnly>
        </div>
      </div>
    </section>

    <!-- FOOTER -->
    <footer class="footer">
      <div class="footer-left">moholy.js — Brian Lapinski, 2026</div>
      <div class="footer-right">
        <a href="https://github.com/lapbrian2/moholy" target="_blank">GitHub</a>
        <a href="https://www.npmjs.com/package/moholy" target="_blank">npm</a>
        <span style="color:var(--text-muted)">MIT</span>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

// Palette gradients
const PALETTE_COLORS: Record<string, string[]> = {
  thermal: ['#000033', '#220066', '#6600aa', '#cc3300', '#ff6600', '#ffcc00', '#ffffff'],
  ocean: ['#001122', '#003355', '#005577', '#0088aa', '#00bbcc', '#44ddee', '#aaeeff'],
  neon: ['#0d0d0d', '#ff00ff', '#00ffff', '#ff0066', '#00ff66', '#ffff00', '#ffffff'],
  monochrome: ['#000000', '#1a1a1a', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'],
  spectral: ['#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#fee08b', '#f46d43', '#9e0142'],
}

function paletteGradient(name: string): string {
  const colors = PALETTE_COLORS[name] || PALETTE_COLORS.spectral
  return `linear-gradient(to right, ${colors.join(', ')})`
}

// Transform animation
const rawVal = ref(0)
const smoothVal = ref(0)
let transformFrame: number | null = null

function animateTransforms() {
  const t = performance.now() / 1000
  const phase = (t % 2) / 2
  const raw = phase < 0.5 ? phase * 2 : 2 - phase * 2 // sawtooth
  rawVal.value = raw
  smoothVal.value += (raw - smoothVal.value) * 0.03 // EMA
  transformFrame = requestAnimationFrame(animateTransforms)
}

onMounted(() => {
  // Scroll reveal
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') })
  }, { threshold: 0.15 })
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))

  // Transform animation
  transformFrame = requestAnimationFrame(animateTransforms)
})

onUnmounted(() => {
  if (transformFrame) cancelAnimationFrame(transformFrame)
})
</script>

<style scoped>
/* HERO */
.hero {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  padding: 0 clamp(32px, 6vw, 120px) 80px;
  position: relative;
  overflow: hidden;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  z-index: 0;
  width: 100%;
  height: 100%;
}

.hero-canvas :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.hero-content {
  position: relative;
  z-index: 1;
  max-width: 720px;
}

.hero h1 {
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(64px, 10vw, 140px);
  line-height: 0.92;
  letter-spacing: -0.04em;
  margin-bottom: 24px;
}

.hero h1 .dot { color: var(--accent); }

.hero h1 .version {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  margin-left: 6px;
  vertical-align: super;
  letter-spacing: 0.05em;
}

.hero .tagline {
  font-family: var(--display);
  font-style: italic;
  font-size: clamp(18px, 2.5vw, 24px);
  font-weight: 300;
  color: var(--text-secondary);
  max-width: 540px;
  line-height: 1.5;
  margin-bottom: 40px;
}

.hero .meta {
  display: flex;
  gap: 32px;
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.hero .meta a { color: var(--text-secondary); }

/* FEATURES */
.features {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1px;
  background: var(--border);
}

.feature {
  background: var(--bg-deep);
  padding: 56px clamp(28px, 4vw, 56px);
}

.feature-symbol {
  font-family: var(--mono);
  font-size: 32px;
  color: var(--accent);
  margin-bottom: 20px;
  display: block;
  opacity: 0.7;
}

.feature h3 {
  font-family: var(--display);
  font-weight: 300;
  font-size: 26px;
  margin-bottom: 12px;
}

.feature p {
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.7;
  max-width: 360px;
}

/* TOC */
.toc {
  padding: 80px clamp(32px, 6vw, 120px);
  border-top: 1px solid var(--border);
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 80px;
}

.toc-intro p {
  font-size: 15px;
  color: var(--text-secondary);
  max-width: 520px;
  line-height: 1.7;
  margin-bottom: 20px;
}

.toc-list { list-style: none; }
.toc-list li {
  display: flex;
  align-items: baseline;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border);
}
.toc-list .num { font-family: var(--mono); font-size: 12px; color: var(--text-muted); min-width: 32px; }
.toc-list .title { font-family: var(--display); font-size: 20px; font-weight: 400; }

/* SECTIONS */
.section {
  padding: clamp(100px, 14vw, 200px) clamp(32px, 6vw, 120px);
  border-top: 1px solid var(--border);
}

.section-number {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--accent-dim);
  letter-spacing: 0.15em;
  text-transform: uppercase;
  margin-bottom: 20px;
  display: block;
}

.section h2 {
  font-family: var(--display);
  font-weight: 300;
  font-size: clamp(44px, 6vw, 80px);
  line-height: 1.05;
  letter-spacing: -0.03em;
  margin-bottom: 48px;
}

.section-body {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: clamp(48px, 7vw, 100px);
  align-items: start;
}

.section-text { max-width: 520px; }
.section-text p { font-size: 15px; color: var(--text-secondary); margin-bottom: 24px; line-height: 1.75; }

.demo-wrap {
  background: var(--bg-surface);
  border: 1px solid var(--border);
  overflow: hidden;
  position: relative;
}

.demo-wrap :deep(canvas) {
  width: 100% !important;
  height: 100% !important;
}

.api-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
.api-table th, .api-table td { text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--border); font-size: 13px; }
.api-table th { font-family: var(--mono); font-size: 10px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.08em; }
.api-table td { color: var(--text-secondary); }

/* FOOTER */
.footer {
  padding: 48px clamp(32px, 6vw, 120px);
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: space-between;
}
.footer-left { font-family: var(--mono); font-size: 12px; color: var(--text-muted); }
.footer-right { display: flex; gap: 24px; font-family: var(--mono); font-size: 12px; }
.footer-right a { color: var(--text-secondary); }

/* CODE BLOCKS */
.code-block {
  background: var(--code-bg);
  border: 1px solid var(--border);
  padding: 20px 24px;
  font-family: var(--mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--text-secondary);
  overflow-x: auto;
  margin-top: 24px;
  white-space: pre;
}
.code-block .kw { color: var(--accent); }
.code-block .str { color: #7ec699; }
.code-block .num { color: #d19a66; }
.code-block .cmt { color: var(--text-muted); }
.code-block .fn { color: #61afef; }

/* PALETTES */
.palette-display {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding-top: 8px;
}

.palette-row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.palette-label {
  font-family: var(--mono);
  font-size: 11px;
  color: var(--text-muted);
  min-width: 100px;
  text-align: right;
  letter-spacing: 0.03em;
}

.palette-gradient {
  flex: 1;
  height: 36px;
  border: 1px solid var(--border);
}

/* TRANSFORMS */
.transform-visual {
  display: flex;
  gap: 24px;
  align-items: flex-end;
  height: 300px;
  padding: 24px;
  background: var(--bg-surface);
  border: 1px solid var(--border);
}

.transform-label {
  font-family: var(--mono);
  font-size: 10px;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  writing-mode: vertical-rl;
  text-orientation: mixed;
}

.transform-bar {
  flex: 1;
  background: rgba(138, 116, 72, 0.3);
  transition: height 0.05s linear;
  min-height: 4px;
}

.transform-bar.smooth {
  background: var(--accent);
  opacity: 0.7;
}

@media (max-width: 768px) {
  .features { grid-template-columns: 1fr; }
  .section-body { grid-template-columns: 1fr; }
  .toc { grid-template-columns: 1fr; gap: 40px; }
}
</style>
