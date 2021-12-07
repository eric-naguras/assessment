import { Queue } from './queue.js'

const q1 = new Queue()
const q2 = new Queue()

q1.enqueue(1)
q1.enqueue(2)
q1.enqueue(3)
q1.enqueue(4)

q2.enqueue(1)
q2.enqueue(2)
q2.enqueue(3)

console.log('length of q1 is', q1.length())
console.log('length of q2 is', q2.length())

let q1Item = q1.dequeue()
console.log('Got item from q1', q1Item)
let q2Item = q2.dequeue()
console.log('Got item from q2', q2Item)
q1Item = q1.dequeue()
console.log('Got item from q1', q1Item)
q2Item = q2.dequeue()
console.log('Got item from q2', q2Item)
q1Item = q1.dequeue()
console.log('Got item from q1', q1Item)

console.log('length of q1 is', q1.length())
console.log('length of q2 is', q2.length())
