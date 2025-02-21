import { createClient } from "redis";
import config from "./env.js";

const redisClient = createClient({
  url: config.redisUrl,
});

redisClient.on("connect", () => console.log("✅ Redis connected successfully"));
redisClient.on("error", (err) => console.error("❌ Redis connection error:", err));

const connectRedis = async () => {
  try {
    await redisClient.connect({
      url: config.redisUrl,
    });
  } catch (error) {
    console.error("❌ Failed to connect to Redis:", error);
    process.exit(1);
  }
};

export { redisClient, connectRedis };