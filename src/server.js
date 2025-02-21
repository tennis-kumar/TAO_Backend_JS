import app from "./app.js";
import config from "./config/env.js";
import { connectRedis } from "./config/redis.js";
import connectDB from "./config/db.js";

const PORT = config.port;

const startServer = async () =>{
  try {
    await connectRedis();
    await connectDB();
    app.listen(PORT, () => { console.log(`🚀 Server is running on port ${PORT}`); });
  } catch (error) {
    log.error("❌ Failed to start server:", error);
    process.exit(1);
  }
};

startServer();