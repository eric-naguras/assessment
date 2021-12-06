/*
Ordernumbers are not unique, this makes it impossible to check if an order
has been processed. So I added a UUID to very line of every file.
*/
const path = require("path");
const fs = require("fs");
const short = require("short-uuid");
const translator = short();
const files = ["export-1.csv", "export-2.csv", "export-3.csv"];
const absolutePath = path.resolve("./assessment");

const procesFile = async (filename) => {
  return new Promise((resolve, reject) => {
    try {
      fs.readFile(`${absolutePath}/${filename}`, "utf8", (err, data) => {
        if (err) {
          console.log(err);
          return reject(err);
        }
        const lines = data.split("\r\n");
        for (let index = 0; index < lines.length; index++) {
          if (index > 0) {
            lines[index] = translator.new() + "," + lines[index] + '\r\n';
          } else {
            lines[index] = lines[index] + "\r\n";
          }
        }
        return resolve(lines);
      });
    } catch (ex) {
      return reject(ex.message);
    }
  });
};

const processFiles = async () => {
  for await (const filename of files) {
    const lines = await procesFile(filename);
    console.log(`${filename} has ${lines.length} orders`);
    fs.writeFileSync(`${absolutePath}/Corrected-${filename}`, lines.join(''));
  }
};

processFiles();
