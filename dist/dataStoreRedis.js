"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/dataStoreRedis.ts
var dataStoreRedis_exports = {};
__export(dataStoreRedis_exports, {
  closeConnectionRedis: () => closeConnectionRedis,
  createConnectionRedis: () => createConnectionRedis,
  listPaymentsReceived: () => listPaymentsReceived,
  paymentsSummary: () => paymentsSummary,
  receivePayment: () => receivePayment,
  updatePaymentProcessorField: () => updatePaymentProcessorField
});
module.exports = __toCommonJS(dataStoreRedis_exports);

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
async function updatePaymentProcessorField(payment, paymentProcessor) {
  await redisClient2.hSet(`payment:${payment.requestedAt}`, {
    correlationId: payment.correlationId,
    amount: payment.amount,
    requestedAt: payment.requestedAt,
    paymentProcessor,
    status_process: "processed"
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
async function listPaymentsReceived() {
  const payments = [];
  const scanOption = { MATCH: "payment:*" };
  for await (const keys of redisClient2.scanIterator(scanOption)) {
    for (let i = 0; i < keys.length; i++) {
      const payment = await redisClient2.hGetAll(keys[i]);
      if (payment.status_process === "received") {
        payments.push(payment);
      }
    }
  }
  return payments.map((payment) => {
    return {
      correlationId: payment.correlationId,
      amount: parseFloat(payment.amount),
      requestedAt: payment.requestedAt
    };
  });
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  closeConnectionRedis,
  createConnectionRedis,
  listPaymentsReceived,
  paymentsSummary,
  receivePayment,
  updatePaymentProcessorField
});
