import Redis from 'ioredis';
import dotenv from 'dotenv';


const redisCluster = new Redis.Cluster(
  [
    {
      host: process.env.REDIS_HOST,
      port: Number(process.env.REDIS_PORT),
    },
  ],
  {
    dnsLookup: (address, callback) => callback(null, address),
    redisOptions: {
      tls: {}, // for ElastiCache serverless
    },
  }
);

export default redisCluster;
