/**
 * moholy_emission — signal-driven emissive glow.
 *
 * Usage (fragment shader):
 *   uniform float uEmission;
 *   vec3 glow = moholyEmission(uEmission, baseColor, 2.0);
 *   gl_FragColor = vec4(glow, 1.0);
 */

/** Add emission glow to base color */
vec3 moholyEmission(float value, vec3 baseColor, float intensity) {
  return baseColor + baseColor * value * intensity;
}

/** Pulsing emission with time */
vec3 moholyEmissionPulse(float value, vec3 baseColor, float intensity, float time) {
  float pulse = 0.5 + 0.5 * sin(time * 3.14159);
  return baseColor + baseColor * value * intensity * pulse;
}

/** Rim-style emission (view-dependent) */
float moholyRimEmission(vec3 normal, vec3 viewDir, float power) {
  float rim = 1.0 - max(dot(normalize(normal), normalize(viewDir)), 0.0);
  return pow(rim, power);
}
