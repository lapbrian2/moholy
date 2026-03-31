/**
 * GLSL chunk loader — import shader code as strings.
 * These can be injected into your shaders via string concatenation
 * or used with Three.js onBeforeCompile.
 */

import moholyColorGLSL from './moholy_color.glsl?raw'
import moholyDisplaceGLSL from './moholy_displace.glsl?raw'
import moholyEmissionGLSL from './moholy_emission.glsl?raw'
import moholyNoiseGLSL from './moholy_noise.glsl?raw'

export const glsl = {
  color: moholyColorGLSL,
  displace: moholyDisplaceGLSL,
  emission: moholyEmissionGLSL,
  noise: moholyNoiseGLSL,
}

export { moholyColorGLSL, moholyDisplaceGLSL, moholyEmissionGLSL, moholyNoiseGLSL }
