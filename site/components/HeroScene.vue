<template>
  <TresGroup ref="groupRef">
    <!-- Central icosahedron -->
    <TresMesh ref="centerRef" :position="[0, 0, 0]">
      <TresIcosahedronGeometry :args="[1, 1]" />
      <TresMeshStandardMaterial
        :color="'#c9a86c'"
        :roughness="0.35"
        :metalness="0.8"
        :wireframe="true"
      />
    </TresMesh>

    <!-- Inner sphere (solid, darker) -->
    <TresMesh :position="[0, 0, 0]">
      <TresSphereGeometry :args="[0.6, 32, 32]" />
      <TresMeshStandardMaterial
        :color="'#1c1c20'"
        :roughness="0.2"
        :metalness="0.9"
      />
    </TresMesh>

    <!-- Orbiting torus 1 -->
    <TresMesh ref="torus1Ref" :rotation="[Math.PI / 3, 0, 0]">
      <TresTorusGeometry :args="[1.8, 0.02, 16, 100]" />
      <TresMeshStandardMaterial :color="'#c9a86c'" :roughness="0.3" :metalness="0.9" />
    </TresMesh>

    <!-- Orbiting torus 2 -->
    <TresMesh ref="torus2Ref" :rotation="[0, Math.PI / 4, Math.PI / 6]">
      <TresTorusGeometry :args="[2.2, 0.015, 16, 100]" />
      <TresMeshStandardMaterial :color="'#8a7448'" :roughness="0.3" :metalness="0.9" />
    </TresMesh>

    <!-- Orbiting torus 3 -->
    <TresMesh ref="torus3Ref" :rotation="[Math.PI / 2, Math.PI / 5, 0]">
      <TresTorusGeometry :args="[2.5, 0.01, 16, 100]" />
      <TresMeshStandardMaterial :color="'#55556a'" :roughness="0.4" :metalness="0.8" />
    </TresMesh>

    <!-- Small orbiting spheres -->
    <TresMesh
      v-for="(orb, i) in orbs"
      :key="i"
      :ref="(el: any) => orbRefs[i] = el"
      :position="orb.pos"
    >
      <TresSphereGeometry :args="[orb.size, 16, 16]" />
      <TresMeshStandardMaterial
        :color="orb.color"
        :roughness="0.2"
        :metalness="0.9"
        :emissive="orb.color"
        :emissive-intensity="0.15"
      />
    </TresMesh>

    <!-- Floating octahedron -->
    <TresMesh ref="octaRef" :position="[2.0, 0.8, -1.0]">
      <TresOctahedronGeometry :args="[0.3, 0]" />
      <TresMeshStandardMaterial :color="'#c9a86c'" :roughness="0.15" :metalness="0.95" />
    </TresMesh>

    <!-- Lighting: 3-point rig -->
    <TresDirectionalLight :position="[5, 5, 3]" :intensity="1.4" color="#fff5e6" />
    <TresDirectionalLight :position="[-3, 2, -2]" :intensity="0.4" color="#e6f0ff" />
    <TresDirectionalLight :position="[0, -2, 5]" :intensity="0.6" color="#c9a86c" />
    <TresAmbientLight :intensity="0.15" color="#404050" />
  </TresGroup>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useLoop } from '@tresjs/core'

const groupRef = ref()
const centerRef = ref()
const torus1Ref = ref()
const torus2Ref = ref()
const torus3Ref = ref()
const octaRef = ref()
const orbRefs: any[] = reactive([])

const orbs = [
  { pos: [2.5, 0, 0] as [number, number, number], size: 0.08, color: '#c9a86c' },
  { pos: [-1.5, 1, 1.5] as [number, number, number], size: 0.06, color: '#8a7448' },
  { pos: [0, -1.5, 2] as [number, number, number], size: 0.1, color: '#e0e0e4' },
  { pos: [1, 1.5, -1.5] as [number, number, number], size: 0.07, color: '#c9a86c' },
  { pos: [-2, -0.5, -1] as [number, number, number], size: 0.05, color: '#55556a' },
  { pos: [0.5, 2, 0.5] as [number, number, number], size: 0.09, color: '#8888a0' },
]

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const t = elapsed * 0.3

  // Rotate central icosahedron
  if (centerRef.value) {
    centerRef.value.rotation.y = t * 0.5
    centerRef.value.rotation.x = t * 0.3
  }

  // Rotate tori
  if (torus1Ref.value) torus1Ref.value.rotation.z = t * 0.4
  if (torus2Ref.value) torus2Ref.value.rotation.x = t * 0.35
  if (torus3Ref.value) torus3Ref.value.rotation.y = t * 0.25

  // Orbit spheres
  for (let i = 0; i < orbs.length; i++) {
    const orb = orbRefs[i]
    if (!orb) continue
    const fi = i
    const speed = 0.2 + fi * 0.05
    const radius = 2.0 + fi * 0.3
    const height = Math.sin(t * 0.4 + fi * 1.2) * 0.8
    const angle = t * speed + fi * 1.0472 // 60deg offset
    orb.position.x = Math.cos(angle) * radius
    orb.position.y = height
    orb.position.z = Math.sin(angle) * radius
  }

  // Float octahedron
  if (octaRef.value) {
    octaRef.value.position.y = 0.8 + Math.sin(t * 0.6) * 0.4
    octaRef.value.rotation.y = t * 0.7
    octaRef.value.rotation.x = t * 0.5
  }

  // Slow rotate entire group
  if (groupRef.value) {
    groupRef.value.rotation.y = t * 0.08
  }
})
</script>
