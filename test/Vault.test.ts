import { Vault } from '../src'

test('should be initialized', () => {
  const vault = new Vault(30)
  expect(vault).not.toBeUndefined()
})

test('initialize with specific size', () => {
  const size = 50
  const vault = new Vault(size)
  expect(vault.getMaxSize()).toBe(size)
})

test('add items', () => {
  const vault = new Vault()
  vault.add({
    frame: 1,
    timestamp: Date.now(),
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: Date.now() + 1000,
    state: {},
  })
  expect(vault.size).toBe(2)
})

test('remove item', () => {
  const vault = new Vault()
  vault.add({
    frame: 1,
    timestamp: Date.now(),
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: Date.now() + 1000,
    state: {},
  })
  const removedItems = vault.remove(1)
  expect(vault.size).toBe(1)
  expect(removedItems.length).toBe(1)
  expect(vault.toArray()[0].frame).toBe(1)
})

test('remove multiple items', () => {
  const vault = new Vault()
  vault.add({
    frame: 1,
    timestamp: Date.now(),
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: Date.now() + 1000,
    state: {},
  })
  vault.add({
    frame: 3,
    timestamp: Date.now() + 2000,
    state: {},
  })
  const removedItems = vault.remove(0, 2)
  expect(vault.size).toBe(1)
  expect(removedItems.length).toBe(2)
  expect(vault.toArray()[0].frame).toBe(3)
})

test('remove multiple items from index', () => {
  const vault = new Vault()
  vault.add({
    frame: 1,
    timestamp: Date.now(),
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: Date.now() + 1000,
    state: {},
  })
  vault.add({
    frame: 3,
    timestamp: Date.now() + 2000,
    state: {},
  })
  const removedItems = vault.remove(1, 2)
  expect(vault.size).toBe(1)
  expect(removedItems.length).toBe(2)
  expect(vault.toArray()[0].frame).toBe(1)
})

test('remove last item', () => {
  const vault = new Vault()
  vault.add({
    frame: 1,
    timestamp: Date.now(),
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: Date.now() + 1000,
    state: {},
  })
  vault.add({
    frame: 3,
    timestamp: Date.now() + 2000,
    state: {},
  })
  const removedItem = vault.removeLast()
  const lastItem = vault.toArray().at(0)
  expect(vault.size).toBe(2)
  expect(removedItem.frame).toBe(3)
  expect(lastItem).not.toBeUndefined()
  expect(lastItem?.frame).toBe(2)
})

test('get around timestamp', () => {
  const vault = new Vault()
  const now = Date.now()
  vault.add({
    frame: 1,
    timestamp: now,
    state: {},
  })
  vault.add({
    frame: 2,
    timestamp: now + 1000,
    state: {},
  })
  vault.add({
    frame: 3,
    timestamp: now + 2000,
    state: {},
  })
  const res = vault.getAroundTimestamp(now + 300)
  expect(res?.older).not.toBeUndefined()
  expect(res?.newer).not.toBeUndefined()
  expect(res?.older?.frame).toBe(1)
  expect(res?.newer?.frame).toBe(2)
})
