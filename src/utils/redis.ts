import { createClient } from "redis";

export const redisClient = createClient().on("error", (err) =>
  console.log("Redis Client Error", err),
);
redisClient.connect();
