"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
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
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/processor.ts
var processor_exports = {};
__export(processor_exports, {
  getServiceHealthDefault: () => getServiceHealthDefault,
  getServiceHealthFallback: () => getServiceHealthFallback,
  paymentProcessorDefault: () => paymentProcessorDefault,
  paymentProcessorFallback: () => paymentProcessorFallback
});
module.exports = __toCommonJS(processor_exports);
var import_axios = __toESM(require("axios"));

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
async function updatePaymentProcessorField(payment, paymentProcessor) {
  await redisClient2.hSet(`payment:${payment.requestedAt}`, {
    correlationId: payment.correlationId,
    amount: payment.amount,
    requestedAt: payment.requestedAt,
    paymentProcessor,
    status_process: "processed"
  });
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

// src/processor.ts
var payment_processor_default = "http://localhost:8001/payments";
var payment_processor_fallback = "http://localhost:8002/payments";
var service_health_default = "http://localhost:8001/payments/service-health";
var service_health_fallback = "http://localhost:8002/payments/service-health";
async function paymentProcessorDefault(payment) {
  await import_axios.default.post(payment_processor_default, payment);
}
async function paymentProcessorFallback(payment) {
  await import_axios.default.post(
    payment_processor_fallback,
    payment
  );
}
async function getServiceHealthDefault() {
  const response = await import_axios.default.get(service_health_default);
  return response.data;
}
async function getServiceHealthFallback() {
  const response = await import_axios.default.get(service_health_fallback);
  return response.data;
}
async function processorPayment() {
  await createConnectionRedis();
  const processorDefault = await getServiceHealthDefault();
  const processorFallback = await getServiceHealthFallback();
  if (!processorDefault.failing && !processorFallback.failing) {
    let payments_to_process = [];
    let update_payments_to_process = [];
    const payment_received = await listPaymentsReceived();
    if (!payment_received || payment_received.length === 0) {
      return;
    }
    for (let i = 0; i < payment_received.length; i++) {
      const paymentPending = paymentProcessorDefault(payment_received[i]);
      const updatePaymentPending = updatePaymentProcessorField(payment_received[i], "default");
      payments_to_process.push(paymentPending);
      update_payments_to_process.push(updatePaymentPending);
    }
    await Promise.all(payments_to_process);
    await Promise.all(update_payments_to_process);
    if (processorDefault.failing && !processorFallback.failing) {
      let payments_to_process2 = [];
      let update_payments_to_process2 = [];
      const payment_received2 = await listPaymentsReceived();
      if (!payment_received2 || payment_received2.length > 0) {
        return;
      }
      for (let i = 0; i < payment_received2.length; i++) {
        const paymentPending = paymentProcessorFallback(payment_received2[i]);
        const updatePaymentPending = updatePaymentProcessorField(payment_received2[i], "fallback");
        payments_to_process2.push(paymentPending);
        update_payments_to_process2.push(updatePaymentPending);
      }
      await Promise.all(payments_to_process2);
      await Promise.all(update_payments_to_process2);
    }
  }
}
setTimeout(async () => {
  await processorPayment();
}, 5e3);
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getServiceHealthDefault,
  getServiceHealthFallback,
  paymentProcessorDefault,
  paymentProcessorFallback
});
