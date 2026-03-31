<template>
  <TresGroup>
    <!-- Procedural terrain plane with vertex displacement -->
    <TresMesh ref="terrainRef" :rotation="[-Math.PI / 3, 0, 0]" :position="[0, -0.5, 0]">
      <TresPlaneGeometry :args="[4, 4, 128, 128]" />
      <TresMeshStandardMaterial
        :color="'#c9a86c'"
        :roughness="0.4"
        :metalness="0.6"
        :wireframe="true"
        :opacity="0.6"
        :transparent="true"
      />
    </TresMesh>

    <!-- Solid terrain underneath -->
    <TresMesh ref="solidRef" :rotation="[-Math.PI / 3, 0, 0]" :position="[0, -0.52, 0]">
      <TresPlaneGeometry :args="[4, 4, 128, 128]" />
      <TresMeshStandardMaterial
        :color="'#1c1c20'"
        :roughness="0.3"
        :metalness="0.7"
      />
    </TresMesh>

    <!-- Lighting -->
    <TresDirectionalLight :position="[2, 4, 1]" :intensity="1.0" color="#fff5e6" />
    <TresDirectionalLight :position="[-1, 2, -2]" :intensity="0.3" color="#c9a86c" />
    <TresAmbientLight :intensity="0.15" color="#404050" />
  </TresGroup>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useLoop } from '@tresjs/core'

const terrainRef = ref()
const solidRef = ref()

// Simple noise for vertex displacement
function noise2D(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453
  return n - Math.floor(n)
}

function fbm(x: number, y: number, octaves: number): number {
  let v = 0, a = 0.5, fx = x, fy = y
  for (let i = 0; i < octaves; i++) {
    v += a * noise2D(fx, fy)
    fx *= 2.0; fy *= 2.0; a *= 0.5
  }
  return v
}

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const t = elapsed * 0.15

  // Displace vertices on both meshes
  for (const meshRef of [terrainRef, solidRef]) {
    if (!meshRef.value) continue
    const geo = meshRef.value.geometry
    const pos = geo.attributes.position
    if (!pos) continue

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i)
      const z = pos.getY(i) // PlaneGeometry uses Y for the second axis
      const height = fbm(x * 1.5 + t, z * 1.5 + t * 0.7, 4) * 0.6
      pos.setZ(i, height)
    }
    pos.needsUpdate = true
    geo.computeVertexNormals()
  }
})
</script>
