/**
 * Signal transforms — applied per-channel before visual encoding.
 */

/** Exponential moving average smoother */
export function smooth(current: number, target: number, factor: number): number {
  return current + (target - current) * (1 - factor)
}

/** Hard cutoff — below threshold returns 0 */
export function threshold(value: number, cutoff: number): number {
  return value < cutoff ? 0 : value
}

/** Remap value from [0,1] to [min,max] */
export function remap(value: number, min: number, max: number): number {
  return min + value * (max - min)
}

/** Clamp to [0,1] */
export function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value
}

/** Invert: 1 - value */
export function invert(value: number): number {
  return 1 - value
}

/** Rate of change (derivative) */
export function derivative(current: number, previous: number, dt: number): number {
  if (dt === 0) return 0
  return (current - previous) / dt
}

/** Easing curves */
export type CurveType = 'linear' | 'ease-in' | 'ease-out' | 'ease-in-out'

export function applyCurve(value: number, curve: CurveType): number {
  switch (curve) {
    case 'linear': return value
    case 'ease-in': return value * value
    case 'ease-out': return 1 - (1 - value) * (1 - value)
    case 'ease-in-out': return value < 0.5
      ? 2 * value * value
      : 1 - Math.pow(-2 * value + 2, 2) / 2
    default: return value
  }
}
