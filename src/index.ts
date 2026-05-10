import "dotenv/config";
import express from "express";
import { WebhookRouter } from "./routes/webhook";
import { HealthRouter } from "./routes/health";
import {reviewWorker} from "./workers/reviewWorker";
import { ReviewsRouter } from "./routes/review";
import { redis } from "./libs/redis";
import rateLimit from "express-rate-limit";
import cors from "cors";

const app = express();
const PORT = process.env.PORT || 3000;

// Rate limiting - 30 request per 15 mins
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30, 
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
})

app.use(cors())
app.use('/webhook',limiter,express.raw({type:"application/json"}));

// Routes
app.set("trust proxy", 1);
app.use('/webhook',WebhookRouter);
app.use('/reviews',ReviewsRouter);
app.use('/health',HealthRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Listening on ${PORT}`);
});

process.on("SIGINT", async () => {
  console.log("Shutting down...");
  await reviewWorker.close();
  await redis.quit();
  process.exit(0);
});

export { app };