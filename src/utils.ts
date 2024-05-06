import { Quat } from './Snapshot'

const PI = 3.14159265359
const PI_TIMES_TWO = 6.28318530718

export const lerp = (a: number, b: number, alpha: number) => {
  return a + (b - a) * alpha
}

export const degreeLerp = (a: number, b: number, alpha: number) => {
  let result: number
  const diff = b - a
  if (diff < -180) {
    // lerp upwards past 360
    b += 360
    result = lerp(a, b, alpha)
    if (result >= 360) {
      result -= 360
    }
  } else if (diff > 180) {
    // lerp downwards past 0
    b -= 360
    result = lerp(a, b, alpha)
    if (result < 0) {
      result += 360
    }
  } else {
    // straight lerp
    result = lerp(a, b, alpha)
  }

  return result
}

export const radianLerp = (a: number, b: number, alpha: number) => {
  let result: number
  const diff = b - a
  if (diff < -PI) {
    // lerp upwards past PI_TIMES_TWO
    b += PI_TIMES_TWO
    result = lerp(a, b, alpha)
    if (result >= PI_TIMES_TWO) {
      result -= PI_TIMES_TWO
    }
  } else if (diff > PI) {
    // lerp downwards past 0
    b -= PI_TIMES_TWO
    result = lerp(a, b, alpha)
    if (result < 0) {
      result += PI_TIMES_TWO
    }
  } else {
    // straight lerp
    result = lerp(a, b, alpha)
  }

  return result
}

// https://github.com/mrdoob/three.js/blob/dev/src/math/Quaternion.js
// http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
export const quatSlerp = (qa: Quat, qb: Quat, t: number) => {
  if (t === 0) return qa
  if (t === 1) return qb

  let x0 = qa.x
  let y0 = qa.y
  let z0 = qa.z
  let w0 = qa.w

  const x1 = qb.x
  const y1 = qb.y
  const z1 = qb.z
  const w1 = qb.w

  if (w0 !== w1 || x0 !== x1 || y0 !== y1 || z0 !== z1) {
    let s = 1 - t
    const cos = x0 * x1 + y0 * y1 + z0 * z1 + w0 * w1
    const dir = cos >= 0 ? 1 : -1
    const sqrSin = 1 - cos * cos

    // Skip the Slerp for tiny steps to avoid numeric problems:
    if (sqrSin > 0.001) {
      const sin = Math.sqrt(sqrSin)
      const len = Math.atan2(sin, cos * dir)

      s = Math.sin(s * len) / sin
      t = Math.sin(t * len) / sin
    }

    const tDir = t * dir

    x0 = x0 * s + x1 * tDir
    y0 = y0 * s + y1 * tDir
    z0 = z0 * s + z1 * tDir
    w0 = w0 * s + w1 * tDir

    // Normalize in case we just did a lerp:
    if (s === 1 - t) {
      const f = 1 / Math.sqrt(x0 * x0 + y0 * y0 + z0 * z0 + w0 * w0)
      x0 *= f
      y0 *= f
      z0 *= f
      w0 *= f
    }
  }

  return { x: x0, y: y0, z: z0, w: w0 }
}
