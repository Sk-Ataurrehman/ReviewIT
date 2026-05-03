import "dotenv/config";
import express from "express";
import { WebhookRouter } from "./routes/webhook";
import { HealthRouter } from "./routes/health";
import {reviewWorker} from "./queues/reviewWorker";
import { redis } from "./utils/redis";

const app = express();
const PORT = process.env.PORT || 3000;

app.use('/webhook',express.raw({type:"application/json"}));

// Routes
app.use('/webhook',WebhookRouter);
app.use('/health',HealthRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

// Add at the bottom of src/index.ts
process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await reviewWorker.close();
  await redis.quit();
  process.exit(0);
});

export { app };