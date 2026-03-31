/**
 * moholy_color — sample a color from a 1D palette texture.
 *
 * Usage:
 *   uniform sampler2D uPalette;  // palette texture from moholy
 *   uniform float uColorValue;   // encoded color value (0-1)
 *   vec3 color = moholyColor(uColorValue, uPalette);
 */

vec3 moholyColor(float value, sampler2D palette) {
  return texture2D(palette, vec2(clamp(value, 0.0, 1.0), 0.5)).rgb;
}

/** Variant: blend between two palette lookups */
vec3 moholyColorBlend(float value1, float value2, float mix, sampler2D palette) {
  vec3 c1 = moholyColor(value1, palette);
  vec3 c2 = moholyColor(value2, palette);
  return mix(c1, c2, clamp(mix, 0.0, 1.0));
}
