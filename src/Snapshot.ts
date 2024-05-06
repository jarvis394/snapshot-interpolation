type Validate<T, V> = keyof T extends string | number | symbol
  ? T[keyof T] extends V
    ? T
    : never
  : never

export type Quat = { x: number; y: number; z: number; w: number }
export type Value = number | string | boolean | Quat | undefined
export type Frame = number
export type Timestamp = number
export type EntityId = string | number
export type Entity<T = Record<string | number | symbol, Value>> = {
  id: EntityId
} & Validate<T, Value>

export type State<T = Record<string | number | symbol, Entity[]>> = Validate<
  T,
  Entity[]
>

export interface Snapshot<S extends State = State> {
  frame: Frame
  timestamp: Timestamp
  state: S
}

export interface InterpolatedSnapshot<E extends Entity = Entity> {
  state: E[]
  percentage: number
  newer: Frame
  older: Frame
}
