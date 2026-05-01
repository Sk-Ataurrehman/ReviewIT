import "dotenv/config";
import express from "express";
import { WebhookRouter } from "./routes/webhook";
import { HealthRouter } from "./routes/health";


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

export { app };