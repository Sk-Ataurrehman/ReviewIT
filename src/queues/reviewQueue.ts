import { Queue, Worker } from "bullmq";
import { redis } from "../libs/redis";

export const  reviewQueue = new Queue("review-pr",{connection: redis});