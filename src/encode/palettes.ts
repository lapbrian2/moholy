/**
 * Color palette presets for signal-to-color encoding.
 * Each palette is an array of hex colors sampled along the 0-1 range.
 */

export type PaletteName = 'thermal' | 'ocean' | 'neon' | 'monochrome' | 'spectral'

export interface RGB {
  r: number
  g: number
  b: number
}

const PALETTES: Record<PaletteName, string[]> = {
  thermal: ['#000033', '#220066', '#6600aa', '#cc3300', '#ff6600', '#ffcc00', '#ffffff'],
  ocean: ['#001122', '#003355', '#005577', '#0088aa', '#00bbcc', '#44ddee', '#aaeeff'],
  neon: ['#0d0d0d', '#ff00ff', '#00ffff', '#ff0066', '#00ff66', '#ffff00', '#ffffff'],
  monochrome: ['#000000', '#1a1a1a', '#333333', '#666666', '#999999', '#cccccc', '#ffffff'],
  spectral: ['#5e4fa2', '#3288bd', '#66c2a5', '#abdda4', '#fee08b', '#f46d43', '#9e0142'],
}

/** Parse hex color to RGB (0-1 range) */
function hexToRGB(hex: string): RGB {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  }
}

/** Lerp between two RGB values */
function lerpRGB(a: RGB, b: RGB, t: number): RGB {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  }
}

/** Sample a palette at position t (0-1) → RGB (0-1) */
export function samplePalette(palette: PaletteName | string[], t: number): RGB {
  const colors = typeof palette === 'string' ? PALETTES[palette] : palette
  if (!colors || colors.length === 0) return { r: 0, g: 0, b: 0 }

  const clamped = Math.max(0, Math.min(1, t))
  const scaled = clamped * (colors.length - 1)
  const index = Math.floor(scaled)
  const frac = scaled - index

  if (index >= colors.length - 1) return hexToRGB(colors[colors.length - 1])
  return lerpRGB(hexToRGB(colors[index]), hexToRGB(colors[index + 1]), frac)
}

/** Generate a Float32Array palette texture (width x 1, RGBA) */
export function generatePaletteTexture(palette: PaletteName | string[], width = 256): Float32Array {
  const data = new Float32Array(width * 4)
  for (let i = 0; i < width; i++) {
    const t = i / (width - 1)
    const rgb = samplePalette(palette, t)
    data[i * 4] = rgb.r
    data[i * 4 + 1] = rgb.g
    data[i * 4 + 2] = rgb.b
    data[i * 4 + 3] = 1.0
  }
  return data
}

export { PALETTES }
