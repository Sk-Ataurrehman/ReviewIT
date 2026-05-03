import { Queue, Worker } from "bullmq";
import { redis } from "../utils/redis";

export const  reviewQueue = new Queue("review-pr",{connection: redis});