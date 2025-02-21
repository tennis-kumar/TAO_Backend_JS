import dotenv from "dotenv";

dotenv.config();

const requiredEnvVars = ["PORT", "CLIENT_URL", "MONGO_URI", "JWT_SECRET", "SESSION_SECRET", "REDIS_URL"];

requiredEnvVars.forEach((key) => {
  if (!process.env[key]) {
    console.error(`❌ Missing required environment variable: ${key}`);
    process.exit(1);
  }
});

export default {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
  sessionSecret: process.env.SESSION_SECRET,
  redisUrl: process.env.REDIS_URL,
  nodeEnv: process.env.NODE_ENV || "development",
  clientUrl: process.env.CLIENT_URL.toString() || "http://localhost:3000",
};