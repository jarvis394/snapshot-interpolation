import { Frame, Snapshot, Timestamp } from './Snapshot'
import { RingBuffer } from 'ring-buffer-ts'

export class Vault<T extends Snapshot = Snapshot> {
  protected buffer: RingBuffer<T>
  /** Buffer is sorted in a reverse order for faster lookups */
  protected sortedBuffer: T[] = []

  /**
   * Vault for storing N last snapshots
   * @param size Vault's elements maximum amount
   * @default 100
   */
  constructor(size: number = 100) {
    this.buffer = new RingBuffer(size)
  }

  public add(snapshot: T) {
    this.buffer.add(snapshot)
    this.sortBuffer()
  }

  public unsafe_addWithoutSort(snapshot: T) {
    this.buffer.add(snapshot)
    this.sortedBuffer = this.buffer.toArray()
  }

  public setMaxSize(newSize: number) {
    this.buffer.resize(newSize)
  }

  public getMaxSize(): number {
    return this.buffer.getSize()
  }

  public get size(): number {
    return this.buffer.getBufferLength()
  }

  public getAroundTimestamp(
    timestamp: Timestamp
  ): { older: T | undefined; newer: T | undefined } | undefined {
    const index = this.binarySearch(
      this.sortedBuffer,
      (cur) => cur.timestamp - timestamp,
      true
    )

    return {
      older: this.sortedBuffer[index],
      newer: this.sortedBuffer[index + 1],
    }
  }

  public getLast(): T | undefined {
    return this.sortedBuffer[0]
  }

  public getClosest(timestamp: Timestamp): T | undefined {
    const snapshots = this.getAroundTimestamp(timestamp)
    if (!snapshots) return

    const older = snapshots.older
      ? Math.abs(timestamp - snapshots.older.timestamp)
      : -1
    const newer = snapshots.newer
      ? Math.abs(timestamp - snapshots.newer.timestamp)
      : NaN

    if (isNaN(newer)) return snapshots.older
    else if (newer <= older) return snapshots.older
    else return snapshots.newer
  }

  public getByFrame(frame: Frame): T | undefined {
    const index = this.binarySearch(
      this.sortedBuffer,
      (cur) => cur.frame - frame
    )
    return this.sortedBuffer[index]
  }

  public clear() {
    this.buffer.clear()
    this.sortedBuffer = []
    return
  }

  /**
   * Removes one or more items form the buffer.
   * @param index Start index of the item to remove.
   * @param count The count of items to remove. (default: 1)
   */
  public remove(index: number, count: number = 1): T[] {
    const removedItems = this.buffer.remove(index, count)
    this.sortBuffer()
    return removedItems
  }

  /**
   * Removes the first item. Like #remove(0).
   */
  public removeFirst(): T {
    const removedItem = this.buffer.removeFirst()
    this.sortBuffer()
    return removedItem
  }
  /**
   * Removes the last item. Like #remove(-1).
   */
  public removeLast(): T {
    const removedItem = this.buffer.removeLast()
    this.sortBuffer()
    return removedItem
  }

  public isEmpty(): boolean {
    return this.buffer.isEmpty()
  }

  public isFull(): boolean {
    return this.buffer.isFull()
  }

  public toArray(): T[] {
    return this.sortedBuffer
  }

  protected sortBuffer() {
    this.sortedBuffer = this.buffer
      .toArray()
      .sort((a, b) => b.timestamp - a.timestamp)
    return this.sortedBuffer
  }

  protected binarySearch(
    array: T[],
    compare: (cur: T) => number,
    findClosestValue?: boolean
  ): number {
    let start = 0
    let end = array.length - 1

    while (start <= end) {
      // Faster Math.floor((start + end) / 2)
      const middle = (start + end) >> 1
      const cmp = compare(array[middle])

      if (cmp > 0) {
        start = middle + 1
      } else if (cmp < 0) {
        end = middle - 1
      } else {
        return middle
      }
    }

    // If finding closest value, return not just
    // -1 (not found) but latest result
    return findClosestValue ? start - 1 : -1
  }
}
