const MS_IN_MIN = 60000
const MS_IN_HOUR = 60 * MS_IN_MIN

export default function runEveryTenthMinute(func: () => void): void {
  function getTimeLeft() {
    const date = new Date()
    function getMinutesInMilliseconds(): number {
      return date.getTime() % MS_IN_HOUR
    }

    const nextTen = 10 + Math.floor(date.getUTCMinutes() / 10) * 10
    const milliseconds = nextTen * MS_IN_MIN
    const timeLeft = milliseconds - getMinutesInMilliseconds()
    return timeLeft
  }
  setTimeout(function callback() {
    func()
    setTimeout(callback, getTimeLeft())
  }, getTimeLeft())
}
