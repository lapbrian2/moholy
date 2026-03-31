<template>
  <TresGroup>
    <!-- 6 signal bars as 3D boxes with golden material -->
    <TresMesh
      v-for="(bar, i) in bars"
      :key="i"
      :ref="(el: any) => barRefs[i] = el"
      :position="bar.pos"
    >
      <TresBoxGeometry :args="[0.3, 1, 0.3]" />
      <TresMeshStandardMaterial
        :color="bar.color"
        :roughness="0.25"
        :metalness="0.85"
        :emissive="bar.color"
        :emissive-intensity="0.1"
      />
    </TresMesh>

    <!-- Base platform -->
    <TresMesh :position="[0, -0.05, 0]" :rotation="[-Math.PI / 2, 0, 0]">
      <TresPlaneGeometry :args="[4, 2]" />
      <TresMeshStandardMaterial :color="'#1c1c20'" :roughness="0.6" :metalness="0.5" />
    </TresMesh>

    <!-- Grid lines on platform -->
    <TresGridHelper :args="[4, 12, '#2a2a32', '#2a2a32']" :position="[0, 0.01, 0]" />

    <!-- Lighting -->
    <TresDirectionalLight :position="[3, 4, 2]" :intensity="1.2" color="#fff5e6" />
    <TresDirectionalLight :position="[-2, 1, -1]" :intensity="0.3" color="#c9a86c" />
    <TresAmbientLight :intensity="0.2" color="#404050" />
  </TresGroup>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useLoop } from '@tresjs/core'

const barRefs: any[] = reactive([])

const bars = [
  { pos: [-1.25, 0.5, 0] as [number, number, number], color: '#c9a86c' },
  { pos: [-0.75, 0.5, 0] as [number, number, number], color: '#b89858' },
  { pos: [-0.25, 0.5, 0] as [number, number, number], color: '#a88844' },
  { pos: [0.25, 0.5, 0] as [number, number, number], color: '#c9a86c' },
  { pos: [0.75, 0.5, 0] as [number, number, number], color: '#b89858' },
  { pos: [1.25, 0.5, 0] as [number, number, number], color: '#a88844' },
]

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const t = elapsed

  for (let i = 0; i < bars.length; i++) {
    const bar = barRefs[i]
    if (!bar) continue

    // Simulate clock signal channels
    const phase = (t % 3) / 3 // 3-second period
    let value: number
    switch (i) {
      case 0: value = phase; break // elapsed
      case 1: value = Math.min(0.016, 0.02); break // delta (small)
      case 2: value = (Math.sin(phase * Math.PI * 2) + 1) * 0.5; break // sin
      case 3: value = (Math.cos(phase * Math.PI * 2) + 1) * 0.5; break // cos
      case 4: value = phase; break // sawtooth
      case 5: value = phase < 0.5 ? 1 : 0; break // square
      default: value = 0
    }

    // Animate bar height
    const height = 0.1 + value * 1.8
    bar.scale.y = height
    bar.position.y = height * 0.5
  }
})
</script>
