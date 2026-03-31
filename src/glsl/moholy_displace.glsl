/**
 * moholy_displace — signal-driven vertex displacement.
 *
 * Usage (vertex shader):
 *   uniform float uDisplacement;
 *   vec3 displaced = moholyDisplace(position, normal, uDisplacement);
 *   gl_Position = projectionMatrix * modelViewMatrix * vec4(displaced, 1.0);
 */

/** Displace along normal by amount */
vec3 moholyDisplace(vec3 pos, vec3 normal, float amount) {
  return pos + normal * amount;
}

/** Displace with noise-based variation */
vec3 moholyDisplaceNoisy(vec3 pos, vec3 normal, float amount, float freq) {
  float noise = sin(pos.x * freq) * cos(pos.y * freq) * sin(pos.z * freq);
  return pos + normal * amount * (0.5 + 0.5 * noise);
}

/** Radial displacement from center */
vec3 moholyDisplaceRadial(vec3 pos, vec3 center, float amount) {
  vec3 dir = normalize(pos - center);
  return pos + dir * amount;
}
