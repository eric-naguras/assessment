import https from "https";

const putOptions = {
  hostname: "hjp1oxbsw6.execute-api.eu-central-1.amazonaws.com",
  port: 443,
  path: "/",
  method: "PUT",
  headers: {
    "x-api-key": "O4MQw5q5Cx2gd7j5875E84Z3Dos2ZfxY6ZoAkqzW",
    "Content-Type": "application/json",
    "Content-Length": 0,
  },
};

let orderSentCounter = 0;

const sendOrder = (order, orderKey) => {
  return new Promise((resolve, reject) => {
    const dataToSend = JSON.stringify(order);
    putOptions.headers["Content-Length"] = dataToSend.length;
    putOptions.path = `/prod/orders/${order.OrderId}`;
    const req = https.request(putOptions, (res) => {
      const status = parseInt(res.statusCode)
      if (status >= 200 && status < 400) {
        orderSentCounter++;
        return resolve({ orderKey, orderSentCounter });
      } else {
        return reject(`Send order rejected with status ${res.statusCode}`);
      }
    });
    req.on("error", (error) => {
      return reject(error);
    });
    req.write(dataToSend);
    req.end;
  });
};

export { sendOrder };
