import fs from 'fs'
import path from 'path'
import currency from 'currency.js'

class FileReader {
  constructor(filePath, errorPath, processedFilesPath, fileQueue, ordersQueue) {
    this.filePath = filePath
    this.errorPath = errorPath
    this.processedFilesPath = processedFilesPath
    this.fileQueue = fileQueue
    this.ordersQueue = ordersQueue
    this.readFile()
  }
  destroy() {
    // Cleanup all referenced vars
    this.fileQueue = null
    this.ordersQueue = null
    console.log('FileReader released all referenced vars')
  }
  readFile() {
    const fileName = this.fileQueue.dequeue()
    if (fileName && fs.existsSync(path.join(this.filePath, fileName))) {
      fs.readFile(path.join(this.filePath, fileName), 'utf8', (err, data) => {
        if (err) {
          // Move errored file or it will be processed again
          fs.renameSync(path.join(this.filePath, fileName), path.join(this.errorPath, fileName))
          console.error(`Error reading ${file}: ${ex}`)
          this.destroy()
          return
        }
        const lines = data.split('\r\n')
        for (let index = 1; index < lines.length; index++) {
          const orderLineStr = lines[index]
          const orderLine = orderLineStr.split(',')
          // Create order
          if (orderLine.length > 4) {
            const order = {
              Key: orderLine[0],
              OrderId: orderLine[1],
              TotalPrice: currency(orderLine[4]).multiply(orderLine[3]).value,
              Orderlines: [
                {
                  ItemId: orderLine[2],
                  Quantity: parseInt(orderLine[3]),
                  PricePerItem: currency(orderLine[4]).value,
                  TotalPrice: currency(orderLine[4]).multiply(orderLine[3]).value
                }
              ]
            }
            this.ordersQueue.enqueue(order)
          }
        }
        // Move processed file to processedFilesPath
        if (fs.existsSync(path.join(this.filePath, fileName))) {
          fs.renameSync(
            path.join(this.filePath, fileName),
            path.join(this.processedFilesPath, fileName)
          )
        }
        console.log(`Done reading ${fileName}`)
        // File is read, prepare instance to be cleaned up by garbage collector
        this.destroy()
      })
    }
  }
}

export { FileReader }
