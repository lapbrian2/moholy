/**
 * moholy_noise — GPU noise functions for signal-driven generative patterns.
 *
 * Usage:
 *   float n = moholyNoise2D(uv * 10.0);
 *   float n3 = moholyNoise3D(position * 5.0);
 */

/** Hash function for noise generation */
float moholyHash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float moholyHash3(vec3 p) {
  return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453123);
}

/** 2D value noise */
float moholyNoise2D(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f); // smoothstep

  float a = moholyHash(i);
  float b = moholyHash(i + vec2(1.0, 0.0));
  float c = moholyHash(i + vec2(0.0, 1.0));
  float d = moholyHash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

/** 3D value noise */
float moholyNoise3D(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);

  float n000 = moholyHash3(i);
  float n100 = moholyHash3(i + vec3(1.0, 0.0, 0.0));
  float n010 = moholyHash3(i + vec3(0.0, 1.0, 0.0));
  float n110 = moholyHash3(i + vec3(1.0, 1.0, 0.0));
  float n001 = moholyHash3(i + vec3(0.0, 0.0, 1.0));
  float n101 = moholyHash3(i + vec3(1.0, 0.0, 1.0));
  float n011 = moholyHash3(i + vec3(0.0, 1.0, 1.0));
  float n111 = moholyHash3(i + vec3(1.0, 1.0, 1.0));

  float nx00 = mix(n000, n100, u.x);
  float nx10 = mix(n010, n110, u.x);
  float nx01 = mix(n001, n101, u.x);
  float nx11 = mix(n011, n111, u.x);

  float nxy0 = mix(nx00, nx10, u.y);
  float nxy1 = mix(nx01, nx11, u.y);

  return mix(nxy0, nxy1, u.z);
}

/** Fractal Brownian Motion (layered noise) */
float moholyFBM(vec2 p, int octaves) {
  float value = 0.0;
  float amplitude = 0.5;
  float frequency = 1.0;

  for (int i = 0; i < 8; i++) {
    if (i >= octaves) break;
    value += amplitude * moholyNoise2D(p * frequency);
    frequency *= 2.0;
    amplitude *= 0.5;
  }

  return value;
}
