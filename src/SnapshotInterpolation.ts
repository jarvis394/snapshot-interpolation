import {
  Entity,
  InterpolatedSnapshot,
  Snapshot,
  Timestamp,
  Value,
} from './Snapshot'
import { Vault } from './Vault'
import { lerp, degreeLerp, radianLerp, quatSlerp } from './utils'

export type InterpolationMethod = 'linear' | 'deg' | 'rad' | 'quat'
type ObjectToMethods<T> = { [_ in keyof T]?: InterpolationMethod }
type InferFromArray<T, Default> = T extends Array<infer V> ? V : Default
type InferFromDeepState<
  T extends Snapshot,
  D extends keyof Snapshot['state'],
> = InferFromArray<T['state'][D], Entity>

export type SnapshotInterpolationOptions = {
  vaultSize?: number
  serverFPS?: number
}

export class SnapshotInterpolation<T extends Snapshot = Snapshot> {
  public static DEFAULT_INTERPOLATION_BUFFER_FRAMES = 3
  public static DEFAULT_SERVER_FPS = 60

  public readonly vault: Vault<T>
  public serverTime = -1
  /**
   * Round-trip time between client and server
   * Works only in a case when client and server times are in sync
   */
  protected _timeOffset = -1
  protected _interpolationBuffer = 1000

  constructor(props?: SnapshotInterpolationOptions) {
    this.vault = new Vault<T>(props?.vaultSize)
    this._interpolationBuffer =
      (1000 / (props?.serverFPS || SnapshotInterpolation.DEFAULT_SERVER_FPS)) *
      SnapshotInterpolation.DEFAULT_INTERPOLATION_BUFFER_FRAMES
  }

  public get interpolationBuffer() {
    return this._interpolationBuffer
  }

  public set interpolationBuffer(ms: number) {
    this._interpolationBuffer = ms
  }

  public get timeOffset() {
    return this._timeOffset
  }

  public addSnapshot(snapshot: T) {
    const timeNow = SnapshotInterpolation.Now()
    const timeSnapshot = snapshot.timestamp
    const timeOffset = timeNow - timeSnapshot

    this._timeOffset = timeOffset
    this.vault.add(snapshot)
  }

  public calcInterpolation<D extends keyof T['state']>(
    parameters: ObjectToMethods<InferFromDeepState<T, D>>,
    deep: D
  ): InterpolatedSnapshot<InferFromDeepState<T, D>> | undefined {
    const serverTime =
      SnapshotInterpolation.Now() - this.timeOffset - this.interpolationBuffer

    const shots = this.vault.getAroundTimestamp(serverTime)
    if (!shots) return

    const { older, newer } = shots
    if (!older || !newer) return

    return this.interpolate(newer, older, serverTime, parameters, deep)
  }

  public interpolate<
    D extends keyof T['state'],
    E extends InferFromDeepState<T, D> = InferFromDeepState<T, D>,
  >(
    snapshotA: T,
    snapshotB: T,
    timeOrPercentage: number,
    fields: ObjectToMethods<E>,
    deep: D
  ): InterpolatedSnapshot<E> {
    const sorted = [snapshotA, snapshotB].sort(
      (a, b) => b.timestamp - a.timestamp
    )

    const newer = sorted[0]
    const older = sorted[1]

    const t0: Timestamp = newer.timestamp
    const t1: Timestamp = older.timestamp

    // t = time (serverTime)
    // p = entity position
    // ------ t0 ------ tnow - t1 ----->> NOW
    // ------ p0 ------ pnow - p1 ----->> NOW
    // ------ 0% ------ x% --- 100% --->> NOW
    const zeroPercent = timeOrPercentage - t1
    const hundredPercent = t0 - t1
    const percentage =
      timeOrPercentage <= 1 ? timeOrPercentage : zeroPercent / hundredPercent

    this.serverTime = lerp(t1, t0, percentage)

    // Need cast to overwrite global abstract `T extends Snapshot`
    // with Snapshot<State<{ [key: D]: E[] }>> (Entity -> local type E)
    const newerState = newer.state[deep] as E[]
    const olderState = older.state[deep] as E[]
    const state = [...newerState]

    for (const index in newerState) {
      const olderEntity = olderState[index]
      const newerEntity = newerState[index]

      Object.entries(fields).forEach(([field, method]) => {
        if (!method) {
          throw new Error(`No method specified for field "${field}"`)
        }

        const newerValue = newerEntity[field]
        const olderValue = olderEntity[field]
        const interpolatedValue = this.lerpByMethod(
          method,
          olderValue,
          newerValue,
          percentage
        )
        // TODO: better typing to fix this error
        // @ts-expect-error Cannot index a generic type,
        // but we know, that field is always a key of state
        state[index][field] = interpolatedValue
        // ^ State[keyof State][number][keyof Entity]: Value
      })
    }

    return {
      state: state,
      percentage,
      newer: newer.frame,
      older: older.frame,
    }
  }

  public lerpByMethod(
    method: InterpolationMethod,
    start: Value,
    end: Value,
    alpha: number
  ) {
    if (typeof start === 'undefined' || typeof end === 'undefined') return

    if (typeof start === 'string' || typeof end === 'string')
      throw new Error(
        `SnapshotInterpolation: cannot interpolate string, got ${{
          start,
          end,
        }}`
      )

    if (typeof start === 'number' && typeof end === 'number') {
      if (method === 'linear') return lerp(start, end, alpha)
      else if (method === 'deg') return degreeLerp(start, end, alpha)
      else if (method === 'rad') return radianLerp(start, end, alpha)
    }

    if (typeof start === 'object' && typeof end === 'object') {
      if (method === 'quat') return quatSlerp(start, end, alpha)
    }

    throw new Error(`No lerp method "${method}" found!`)
  }

  public static Now() {
    return Date.now()
  }
}
