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

// src/redisConnectionManager.ts
var redisConnectionManager_exports = {};
__export(redisConnectionManager_exports, {
  redisConnection: () => redisConnection
});
module.exports = __toCommonJS(redisConnectionManager_exports);
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  redisConnection
});
