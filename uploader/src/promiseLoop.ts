type Task = () => Promise<void>
const functions: Task[] = []
let pending = false

function process() {
  if (functions.length > 0) {
    pending = true
    const [task] = functions.splice(0, 1)
    task()
      .then(process)
      .catch((err) => {
        console.error('Promise loop: ', err)
        process()
      })
  } else {
    pending = false
  }
}

function push(task: Task): void {
  functions.push(task)
  if (pending) {
    return
  }

  process()
}

const promiseLoop = {
  push,
}

export default promiseLoop
