import fs from 'fs'
import currency from 'currency.js'

const readFile = (file) => {
  return new Promise((resolve, reject) => {
    try {
      const orders = []
      console.log(`Start reading ${file}`)
      fs.readFile(file, 'utf8', (err, data) => {
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
            orders.push(order)
          }
        }
        console.log(`Done reading ${file}`)
        return resolve(orders)
      })
    } catch (ex) {
      return reject(ex.message)
    }
  })
}

export { readFile }
