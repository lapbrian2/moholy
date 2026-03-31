<template>
  <TresGroup ref="groupRef">
    <!-- 3 metaball-like spheres that orbit and pulse -->
    <TresMesh ref="blob1Ref" :position="[0.5, 0, 0]">
      <TresSphereGeometry :args="[0.5, 32, 32]" />
      <TresMeshPhysicalMaterial
        :color="activeColor"
        :roughness="0.15"
        :metalness="0.9"
        :clearcoat="1.0"
        :clearcoat-roughness="0.1"
        :emissive="activeColor"
        :emissive-intensity="emissionVal * 0.3"
      />
    </TresMesh>

    <TresMesh ref="blob2Ref" :position="[-0.4, 0.3, 0.2]">
      <TresSphereGeometry :args="[0.4, 32, 32]" />
      <TresMeshPhysicalMaterial
        :color="activeColor"
        :roughness="0.2"
        :metalness="0.85"
        :clearcoat="0.8"
        :emissive="activeColor"
        :emissive-intensity="emissionVal * 0.2"
      />
    </TresMesh>

    <TresMesh ref="blob3Ref" :position="[0.0, -0.4, -0.3]">
      <TresSphereGeometry :args="[0.35, 32, 32]" />
      <TresMeshPhysicalMaterial
        :color="activeColor"
        :roughness="0.18"
        :metalness="0.88"
        :clearcoat="0.9"
        :emissive="activeColor"
        :emissive-intensity="emissionVal * 0.25"
      />
    </TresMesh>

    <!-- Wireframe shell -->
    <TresMesh ref="shellRef" :position="[0, 0, 0]">
      <TresIcosahedronGeometry :args="[1.2, 2]" />
      <TresMeshBasicMaterial :color="activeColor" :wireframe="true" :opacity="0.15" :transparent="true" />
    </TresMesh>

    <!-- Lighting -->
    <TresDirectionalLight :position="[3, 4, 2]" :intensity="1.6" color="#fff5e6" />
    <TresDirectionalLight :position="[-2, 1, -3]" :intensity="0.4" color="#e6f0ff" />
    <TresPointLight :position="[0, 0, 0]" :intensity="emissionVal * 2" :color="activeColor" :distance="4" />
    <TresAmbientLight :intensity="0.1" color="#404050" />
  </TresGroup>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useLoop } from '@tresjs/core'

const props = defineProps<{
  color?: string
  emission?: number
}>()

const activeColor = computed(() => props.color || '#c9a86c')
const emissionVal = computed(() => props.emission ?? 0.5)

const groupRef = ref()
const blob1Ref = ref()
const blob2Ref = ref()
const blob3Ref = ref()
const shellRef = ref()

const { onBeforeRender } = useLoop()

onBeforeRender(({ elapsed }) => {
  const t = elapsed * 0.4

  // Orbit blobs
  if (blob1Ref.value) {
    blob1Ref.value.position.x = Math.sin(t * 0.7) * 0.6
    blob1Ref.value.position.y = Math.cos(t * 0.9) * 0.4
    blob1Ref.value.position.z = Math.sin(t * 0.5) * 0.3
    const s = 1.0 + Math.sin(t * 1.5) * 0.1
    blob1Ref.value.scale.set(s, s, s)
  }

  if (blob2Ref.value) {
    blob2Ref.value.position.x = Math.sin(t * 1.1 + 2) * 0.5
    blob2Ref.value.position.y = Math.cos(t * 0.8 + 1) * 0.5
    blob2Ref.value.position.z = Math.cos(t * 0.6 + 2) * 0.4
    const s = 1.0 + Math.sin(t * 1.2 + 1) * 0.12
    blob2Ref.value.scale.set(s, s, s)
  }

  if (blob3Ref.value) {
    blob3Ref.value.position.x = Math.sin(t * 0.6 + 4) * 0.45
    blob3Ref.value.position.y = Math.cos(t * 1.2 + 3) * 0.35
    blob3Ref.value.position.z = Math.sin(t * 0.9 + 1.5) * 0.5
    const s = 1.0 + Math.sin(t * 0.9 + 2) * 0.08
    blob3Ref.value.scale.set(s, s, s)
  }

  // Rotate wireframe shell
  if (shellRef.value) {
    shellRef.value.rotation.y = t * 0.15
    shellRef.value.rotation.x = t * 0.1
  }

  // Rotate whole group slowly
  if (groupRef.value) {
    groupRef.value.rotation.y = t * 0.1
  }
})
</script>
