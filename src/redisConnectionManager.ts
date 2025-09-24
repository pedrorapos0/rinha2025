import { createClient } from 'redis';

const redisClient = createClient();

class RedisConnectionManager {
private static instance: RedisConnectionManager;
  private isConnected = false;

   private constructor() {
   
  }

    public static getInstance(): RedisConnectionManager {
    if (!RedisConnectionManager.instance) {
      RedisConnectionManager.instance = new RedisConnectionManager();
    }
    return RedisConnectionManager.instance;
  }

  public async connect(): Promise<void> {
    if (!this.isConnected) {
      console.log('Conectando ao Redis...');
      await redisClient.connect();
      this.isConnected = true;
      console.log('Conexão com o Redis estabelecida.');
    } else {
      console.log('Já está conectado ao Redis.');
    }
  }

  public getClient() {
    return redisClient;
  }
}

export const redisConnection = RedisConnectionManager.getInstance();
