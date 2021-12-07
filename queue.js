/*
This a mock Queue.
In reality this would be a fully managed, always available
and always consistent Queue like AWSS SQS or RabbitMQ.
*/

function Queue() {
  this.items = []
}

Queue.prototype.enqueue = function (e) {
  this.items.push(e)
}

Queue.prototype.dequeue = function (e) {
  return this.items.shift()
}

Queue.prototype.length = function () {
  return this.items.length
}

export { Queue }
