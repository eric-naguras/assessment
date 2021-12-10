class QueueProcessor {
  constructor(queueName, sendOrderFunction, hrstart, eventEmitter) {
    this.queue = queueName
    this.sendOrder = sendOrderFunction
    this.hrstart = hrstart
    if (!queueName || !sendOrderFunction || !hrstart) {
      throw new Error('QueueProcessor is missing one or more required parameters')
    } 
    eventEmitter.on('process', () => this.process())
  }

  process() {
    // Get order from Queue
    const order = this.queue.dequeue()
    if (order) {
      // Remove the OrderKey as the order endpoint will not accept it
      const orderKey = order.Key
      delete order.Key
      // Send the order to the endpoint without waiting for a response
      let orderSendStart = process.hrtime()
      this.sendOrder(order, orderKey)
        .then((response) => {
          const orderSendEnd = process.hrtime(orderSendStart)
          console.log(
            `Queue length: ${this.queue.length()} Queue handler sent order ${
              response.orderKey
            } successfuly. Total orders sent: ${response.orderSentCounter}. time: %ds %dms'`,
            orderSendEnd[0],
            orderSendEnd[1] / 1000000
          )

          // This is just for timing purposes
          if (response.orderSentCounter === 3000) {
            const hrend = process.hrtime(this.hrstart)
            console.info('Execution time: %ds %dms', hrend[0], hrend[1] / 1000000)
          }

          // When a response is received, call process recursively
          this.process()
        })
        .catch((ex) => {
          console.log(`Queue handler has error sending order ${orderKey}, re-adding to queue ${ex}`)
          // Order sending failed, re-add order to queue
          order.Key = orderKey
          this.queue.enqueue(order)
          // When an error is received, call process recursively
          this.process()
        })
    }
  }
}

export { QueueProcessor }
