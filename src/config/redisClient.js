import { createClient } from "redis";

const redisClient = createClient();
redisClient
.connect()
.then(() => console.log("✅ Redis connected successfully"))
.catch(console.error);

export default redisClient;
