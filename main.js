import path from "path";
import fs from "fs";
import { readFile } from "./fileReader.js";
import { Queue } from "./queue.js";
import { sendOrder } from "./orderSender.js";
const orderFilesPath = path.resolve("./assessment");
const newQueuesInterval = 250; // time in ms
const fileReadInterval = 30000; // time in ms
let hrstart

const ordersToBeProcessed = new Queue();

// Get corrected order files from directory
const getOrderFiles = (files) => {
  const promises = files.map((file) =>
    readAFile(path.join(orderFilesPath, file))
  );
  return Promise.all(promises);
};

const readAFile = (file) => {
  return new Promise((resolve, reject) => {
    readFile(file)
      .then((orders) => {
        console.log(`Got ${orders.length} from ${file}`);
        // Add orders to queue
        for (const order of orders) {
          ordersToBeProcessed.enqueue(order);
        }
        // Move file to other directory
        const dest = file.replace("assessment", "done");
        fs.renameSync(file, dest);
        return resolve();
      })
      .catch((ex) => {
        console.error(`Error reading ${file}: ${ex}`);
        return reject(ex.message);
      });
  });
};

const processOrderQueue = () => {
  // Get order from Queue
  const order = ordersToBeProcessed.dequeue();
  if (order) {
    // Remove the OrderKey as the order endpoint will not accept it
    const orderKey = order.Key;
    delete order.Key;
    // Send the order to the endpoint without waiting for a response
    sendOrder(order, orderKey)
      .then((response) => {

        // This is just for timing purposes
        if (response.orderSentCounter === 3000) {
          const hrend = process.hrtime(hrstart);
          console.info(
            "Execution time (hr): %ds %dms",
            hrend[0],
            hrend[1] / 1000000
          );
        }
        console.log(
          `${ordersToBeProcessed.length()} Queue handler sent order ${
            response.orderKey
          } successfuly. Total orders sent: ${response.orderSentCounter}`
        );
        processOrderQueue();
      })
      .catch((ex) => {
        console.log(
          `Queue handler has error sending order ${orderKey}, re-adding to queue ${ex}`
        );
        // Order sending failed, re-add order to queue
        order.Key = orderKey;
        ordersToBeProcessed.enqueue(order);
        processOrderQueue();
      });
  }
};

const readDirectory = () => {
  fs.readdir(orderFilesPath, (err, files) => {
    if (err) {
      console.log(`Error reading ${orderFilesPath}: ${err.message}`);
    }
    if (files) {
      // Maybe don't use too many files each step, might lead to overflows
      const filesToProcess = files
        .filter((f) => f.includes("Corrected-"))
        .splice(0, 5);
      if (filesToProcess.length > 0) {
        getOrderFiles(filesToProcess)
      }
    }
  });
  setTimeout(() => {
    readDirectory();
  }, fileReadInterval);
};

const start = () => {
  hrstart = process.hrtime();
  // Create a number of queue handlers
  setInterval(() => {
    // No need to add handlers if queue is empty
    if (ordersToBeProcessed.length() > 0) {
      // Create 3 handlers
      processOrderQueue();
      processOrderQueue();
      processOrderQueue();
    }
  }, newQueuesInterval);
  readDirectory();
};

start();
