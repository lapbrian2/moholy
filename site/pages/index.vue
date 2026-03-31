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
import { onMounted } from 'vue'

onMounted(() => {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((e) => { if (e.isIntersecting) e.target.classList.add('visible') })
  }, { threshold: 0.15 })
  document.querySelectorAll('.reveal').forEach((el) => observer.observe(el))
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

@media (max-width: 768px) {
  .features { grid-template-columns: 1fr; }
  .section-body { grid-template-columns: 1fr; }
  .toc { grid-template-columns: 1fr; gap: 40px; }
}
</style>
