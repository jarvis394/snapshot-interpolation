import {
  Snapshot as BaseSnapshot,
  State as BaseState,
  SnapshotInterpolation,
  Entity,
  EntityId,
} from '../src'

type SnapshotPlayer = Entity<{
  id: EntityId
  bullets: number
  angle: number
  positionX: number
  positionY: number
  velocityX: number
  velocityY: number
  isRotating: boolean
}>

type State = BaseState<{
  players: SnapshotPlayer[]
}>

interface Snapshot extends BaseSnapshot<State> {
  gameEnded: boolean
}

const SI = new SnapshotInterpolation<Snapshot>({
  vaultSize: 10,
})

const snapshotA: Snapshot = {
  frame: 0,
  timestamp: Date.now(),
  gameEnded: false,
  state: {
    players: [
      {
        id: '1',
        positionX: 0,
        positionY: 0,
        velocityX: 0,
        velocityY: 0,
        bullets: 0,
        angle: 0,
        isRotating: false,
      },
    ],
  },
}

const snapshotB: Snapshot = {
  frame: 2,
  timestamp: Date.now() + (1000 / 60) * 2,
  gameEnded: false,
  state: {
    players: [
      {
        id: '1',
        positionX: 100,
        positionY: 0,
        velocityX: 50,
        velocityY: 0,
        bullets: 0,
        angle: 0,
        isRotating: false,
      },
    ],
  },
}

SI.addSnapshot(snapshotA)
SI.addSnapshot(snapshotB)

const res = SI.interpolate(
  snapshotA,
  snapshotB,
  0.5,
  {
    positionX: 'linear',
    velocityX: 'linear',
  },
  'players'
)

console.log(res)
