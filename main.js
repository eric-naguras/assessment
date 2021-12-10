import path from 'path'
import fs from 'fs'
import { Queue } from './queue.js'
import { FileReader } from './FileReader.js'
import { QueueProcessor } from './QueueProcessor.js'
import EventEmitter from 'events'
const sourcePath = path.resolve('./files-source')
const errorFilesPath = path.resolve('./errored-files')
const processedFilesPath = path.resolve('./done')
const MAX_FILES_TO_READ = 50
const MAX_QUEUE_PROCESSORS = 3000
const filesToBeProcessedQueue = new Queue()
const ordersToBeProcessed = new Queue()
let hrstart,
  orderSentCounter = 0,
  queueProcessorsCreated = false

const readDirectory = (sourcePath, filesQueue) => {
  return new Promise((resolve, reject) => {
    fs.readdir(sourcePath, (err, files) => {
      if (err) {
        return reject(`Error reading ${sourcePath}: ${ex.message}`)
      }
      // Filter files to only include the correct files types
      const filesToProcess = files.filter((f) => f.includes('Corrected-'))
      // Add the files to the filesQueue
      filesToProcess.forEach((file) => {
        filesQueue.enqueue(file)
      })
      return resolve(files.length)
    })
  })
}

const sendOrder = (order, orderKey) => {
  return new Promise((resolve, reject) => {
    const failed = Math.floor(Math.random() * 50 + 1) === 25
    setTimeout(() => {
      if (failed) {
        return reject('Send order rejected with status 500')
      }
      orderSentCounter++
      return resolve({ orderKey, orderSentCounter })
    }, 1000)
  })
}

const start = () => {
  const eventEmitter = new EventEmitter()
  async function process() {
    // Read the source directory and add found files to filesQueue
    const NrOfFilesRead = await readDirectory(sourcePath, filesToBeProcessedQueue).catch((ex) =>
      console.log(ex)
    )
    NrOfFilesRead ? console.log(`Read ${NrOfFilesRead} files`) : 0
    // Create as many fileReaders as needed, up to the max allowed
    // FileReaders only read a single file, when done will be disposed by garbage collector
    const maxFileReaders = NrOfFilesRead > MAX_FILES_TO_READ ? MAX_FILES_TO_READ : NrOfFilesRead
    for (let index = 0; index < maxFileReaders; index++) {
      new FileReader(
        sourcePath,
        errorFilesPath,
        processedFilesPath,
        filesToBeProcessedQueue,
        ordersToBeProcessed
      )
    }
    // Only create queue processors if there is a need and if they have not created yet
    if (NrOfFilesRead && !queueProcessorsCreated) {
      queueProcessorsCreated = true
      eventEmitter.setMaxListeners(MAX_QUEUE_PROCESSORS)
      // Create queue processors, up to the max allowed
      for (let index = 0; index < MAX_QUEUE_PROCESSORS; index++) {
        new QueueProcessor(ordersToBeProcessed, sendOrder, hrstart, eventEmitter)
      }
    }
    eventEmitter.emit('process')
  }
  // Skip the first interval waiting period
  process()
  setInterval(process, 500)
}

hrstart = process.hrtime()
start()
