import { createClient } from "redis";

const redisClient = createClient({
    url: process.env.REDIS_URL
});
// const redisClient = createClient();
redisClient
.connect()
.then(() => console.log("✅ Redis connected successfully"))
.catch(console.error);

export default redisClient;
