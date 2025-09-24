"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/server.ts
var import_express = __toESM(require("express"));
var import_cors = __toESM(require("cors"));

// src/redisConnectionManager.ts
var import_redis = require("redis");
var redisClient = (0, import_redis.createClient)();
var RedisConnectionManager = class _RedisConnectionManager {
  static instance;
  isConnected = false;
  constructor() {
  }
  static getInstance() {
    if (!_RedisConnectionManager.instance) {
      _RedisConnectionManager.instance = new _RedisConnectionManager();
    }
    return _RedisConnectionManager.instance;
  }
  async connect() {
    if (!this.isConnected) {
      console.log("Conectando ao Redis...");
      await redisClient.connect();
      this.isConnected = true;
      console.log("Conex\xE3o com o Redis estabelecida.");
    } else {
      console.log("J\xE1 est\xE1 conectado ao Redis.");
    }
  }
  getClient() {
    return redisClient;
  }
};
var redisConnection = RedisConnectionManager.getInstance();

// src/dataStoreRedis.ts
var redisClient2 = redisConnection.getClient();
async function createConnectionRedis() {
  await redisConnection.connect();
}
async function closeConnectionRedis() {
  await redisClient2.close();
}
async function receivePayment(correlationId, amount) {
  const requestedAt = (/* @__PURE__ */ new Date()).toISOString();
  await redisClient2.hSet(`payment:${requestedAt}`, {
    correlationId,
    "amount": amount,
    "requestedAt": `${requestedAt}`,
    "paymentProcessor": "",
    "status_process": "received"
  });
}
async function paymentsSummary(from, to) {
  const payments = [];
  const scanOption = { MATCH: "payment:*" };
  for await (const keys of redisClient2.scanIterator(scanOption)) {
    for (let i = 0; i < keys.length; i++) {
      const payment = await redisClient2.hGetAll(keys[i]);
      payments.push(payment);
    }
  }
  if (from && to) {
    const filteredPaymentsDefault = payments.filter((payment) => new Date(payment.requestedAt) >= new Date(from) && new Date(payment.requestedAt) <= new Date(to) && payment.paymentProcessor === "default");
    let totalAmountDefault2 = filteredPaymentsDefault.reduce(
      (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount),
      0
    );
    const filteredPaymentsFallback = payments.filter((payment) => new Date(payment.requestedAt) >= new Date(from) && new Date(payment.requestedAt) <= new Date(to) && payment.paymentProcessor === "fallback");
    let totalAmountfallback = filteredPaymentsDefault.reduce(
      (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount),
      0
    );
    const summary2 = {
      default: {
        totalRequests: filteredPaymentsDefault.length,
        totalAmount: totalAmountDefault2
      },
      fallback: {
        totalRequests: filteredPaymentsFallback.length,
        totalAmount: totalAmountfallback
      }
    };
    return summary2;
  }
  let totalAmountDefault = payments.filter((payment) => payment.paymentProcessor === "default").reduce(
    (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount),
    0
  );
  let totalAmountFallback = payments.filter((payment) => payment.paymentProcessor === "fallback").reduce(
    (accumulator, currentValue) => accumulator + parseFloat(currentValue.amount),
    0
  );
  const summary = {
    default: {
      totalRequests: payments.filter((payment) => payment.paymentProcessor === "default").length,
      totalAmount: totalAmountDefault
    },
    fallback: {
      totalRequests: payments.filter((payment) => payment.paymentProcessor === "fallback").length,
      totalAmount: totalAmountFallback
    }
  };
  return summary;
}

// src/server.ts
(async () => {
  await createConnectionRedis();
  const server = (0, import_express.default)();
  server.use((0, import_cors.default)());
  server.use(import_express.default.json());
  server.post("/payments", async (req, res) => {
    const { correlationId, amount } = req.body;
    await receivePayment(correlationId, amount);
    return res.status(201).send();
  });
  server.get("/payments-summary", async (req, res) => {
    const from = req.query.from;
    const to = req.query.to;
    const summary = await paymentsSummary(from, to);
    return res.json(summary);
  });
  server.use((err, _req, res) => {
    return res.json({
      status: "Error",
      message: err.message
    });
  });
  server.listen(8e3, () => {
    console.log("Server is Running port 8000!");
  });
})().catch(async () => {
  await closeConnectionRedis();
});
