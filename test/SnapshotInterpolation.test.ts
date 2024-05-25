import {
  SnapshotInterpolation,
  Entity,
  Quat,
  State as BaseState,
  Snapshot as BaseSnapshot,
  InterpolatedSnapshot,
} from '../src'

type SnapshotHero = Entity<{
  x: number
  y: number
  d: number
  r: number
  q: Quat
}>

type State = BaseState<{
  heroes: SnapshotHero[]
}>

interface Snapshot extends BaseSnapshot<State> {}

const SI = new SnapshotInterpolation<Snapshot>({ vaultSize: 30 })
const now = Date.now() - 1000
let snapshot: Snapshot
let frame1: number
let frame2: number
let interpolatedSnapshot: InterpolatedSnapshot<SnapshotHero> | undefined

const interpolationOptions = {
  x: 'linear',
  y: 'linear',
  d: 'deg',
  r: 'rad',
  q: 'quat',
} as const

test('should be initialized', () => {
  expect(SI).not.toBeUndefined()
})

test('initialize with server fps', () => {
  const SI = new SnapshotInterpolation({ serverFPS: 20 })
  const buffer = SI.interpolationBuffer
  expect(buffer).toBe(150)
})

test('calc interpolated without any data', () => {
  interpolatedSnapshot = SI.calcInterpolation(interpolationOptions, 'heroes')
  expect(interpolatedSnapshot).toBeUndefined()
})

test('should create and add snapshot', async () => {
  snapshot = {
    frame: 1,
    timestamp: now,
    state: {
      heroes: [
        {
          id: 'hero',
          x: 0,
          y: 0,
          d: 0,
          r: 0,
          q: { x: 0, y: 0, z: 0, w: 1 },
        },
      ],
    },
  }
  frame1 = snapshot.frame
  SI.addSnapshot(snapshot)
  expect(SI.vault.size).toBe(1)
})

test('calc interpolated with not enough data', async () => {
  interpolatedSnapshot = SI.calcInterpolation(interpolationOptions, 'heroes')
  expect(interpolatedSnapshot).toBeUndefined()
})

test('vault should have a size of one', () => {
  expect(SI.vault.size).toBe(1)
})

test('getting latest snapshot should have same id', () => {
  const s = SI.vault.getLast()
  expect(s?.frame).toBe(snapshot.frame)
})

test('should create and add another snapshot', async () => {
  snapshot = {
    frame: 2,
    timestamp: now + 5000,
    state: {
      heroes: [
        {
          id: 'hero',
          x: 10,
          y: 10,
          d: 90,
          r: Math.PI / 4,
          q: { x: 0, y: 0.707, z: 0, w: 0.707 },
        },
      ],
    },
  }
  frame2 = snapshot.frame
  SI.addSnapshot(snapshot)
  expect(SI.vault.size).toBe(2)
})

test('should get interpolated value', () => {
  interpolatedSnapshot = SI.calcInterpolation(interpolationOptions, 'heroes')
  expect(interpolatedSnapshot).not.toBeUndefined()
})

test('can not interpolate strings', () => {
  expect(() => {
    SI.calcInterpolation({ id: 'linear' }, 'heroes')
  }).toThrow()
})

test('should have same id as original snapshots', () => {
  if (!interpolatedSnapshot) throw new Error('No interpolatedSnapshot')
  const mergedFrame1 = interpolatedSnapshot.older + interpolatedSnapshot.newer
  const mergedFrame2 = frame1 + frame2
  expect(mergedFrame1).toBe(mergedFrame2)
})

test('values should be interpolated', () => {
  const entity = interpolatedSnapshot?.state.find((e) => e.id === 'hero')
  if (!interpolatedSnapshot || !entity)
    throw new Error('No interpolatedSnapshot or entity')

  expect(entity.x > 0 && entity.x < 10).toBeTruthy()
  expect(entity.r > 0 && entity.r < Math.PI / 4).toBeTruthy()
  expect(entity.d > 0 && entity.d < 90).toBeTruthy()
  expect(entity.q.w < 1 && entity.q.w > 0.707).toBeTruthy()
  expect(entity.q.y > 0 && entity.q.y < 0.707).toBeTruthy()
})

test('custom interpolation', () => {
  const shots = SI.vault.getAroundTimestamp(now + 8)
  if (!shots?.older || !shots.newer)
    throw new Error('No shots around timestamp')
  const interpolated = SI.interpolate(
    shots.older,
    shots.newer,
    0.5,
    interpolationOptions,
    'heroes'
  )

  const x = interpolated.state[0].x
  expect(x > 0 && x < 10).toBeTruthy()
  expect(interpolated.percentage).toBe(0.5)
})
