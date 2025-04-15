const Redis = require("ioredis");
require("dotenv").config();

let redis;

if (process.env.NODE_ENV === "production") {
  redis = new Redis({
    host: process.env.REDIS_HOST,
    port: Number(process.env.REDIS_PORT),
    tls: {}, // required for ElastiCache Serverless
  });
} else {
  redis = new Redis({
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  });
}

// Logging connection events
redis.on("connect", () => {
  console.log("✅ Redis connected");
});

redis.on("error", (err) => {
  console.error("❌ Redis connection error:", err);
});

module.exports = redis;
