import runEveryTenthMinute from '../src/runEveryTenthMinute'
import MockDate from 'mockdate'

jest.useFakeTimers()

test('XX:00', () => {
  const date = new Date()
  date.setMinutes(0)
  date.setSeconds(0)
  date.setMilliseconds(0)
  MockDate.set(date)

  runEveryTenthMinute(() => {})
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    10 * 60 * 1000
  )
})

test('XX:24', () => {
  const date = new Date()
  date.setMinutes(24)
  date.setSeconds(0)
  date.setMilliseconds(0)
  MockDate.set(date)

  runEveryTenthMinute(() => {})
  expect(setTimeout).toHaveBeenLastCalledWith(
    expect.any(Function),
    (10 - 4) * 60 * 1000
  )
})
