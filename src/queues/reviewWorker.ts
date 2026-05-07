import { Worker, Job } from "bullmq";
import { ReviewJob } from "../types";
import { redisURL } from "../config";
import { getPRDifference, postReviewComments } from "../services/githubService";
import IORedis from "ioredis";
import { getAIResponse } from "../services/groqService";

const workerRedis = new IORedis(redisURL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const reviewWorker = new Worker<ReviewJob>(
  "review-pr",
  async (job: Job<ReviewJob>) => {
    const { prNumber, prTitle, prBody, repositoryName, prHeadSha } = job.data;
    const prDiff = await getPRDifference({
      repoFullName: repositoryName,
      prNumber: prNumber,
    });
    const reviewResponse = await getAIResponse({ prTitle, prBody, prDiff });
    const [owner, repo] = repositoryName.split("/");

    const postedCount = await postReviewComments({
      owner,
      repo,
      pull_number: prNumber,
      headsha: prHeadSha,
      summary: reviewResponse.summary,
      comments: reviewResponse.comments,
    });

    console.log(`PR ${prNumber} Review Complete - Posted ${postedCount} comments.`);

  },
  {
    connection: workerRedis,
    concurrency: 3,
  },
);

reviewWorker.on("completed", (job) => console.log("Job completed:", job.id));
reviewWorker.on("failed", (job, err) =>
  console.error("Job failed:", job?.id, err.message),
);
