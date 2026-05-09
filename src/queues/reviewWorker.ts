import { Worker, Job } from "bullmq";
import { ReviewJob } from "../types";
import { redisURL } from "../config";
import { getPRDifference, postReviewComments } from "../services/githubService";
import IORedis from "ioredis";
import { getAIResponse } from "../services/groqService";
import { prisma } from "../utils/prisma";

const workerRedis = new IORedis(redisURL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
});

export const reviewWorker = new Worker<ReviewJob>(
  "review-pr",
  async (job: Job<ReviewJob>) => {
    const { prNumber, prTitle, prBody, repositoryName, prHeadSha } = job.data;
    const startTime = Date.now();
    console.log(`Reviewing PR #${prNumber} in ${repositoryName}`);

    // Check if the PR review is already in progress
    let review = await prisma.review.findUnique({
      where: {repoFullName_prNumber_headSha: {
        repoFullName: repositoryName,
        prNumber, headSha: prHeadSha
      }},
    });

    if(review){
      if(review.status === 'COMPLETED' || review.status === 'PENDING' || review.status === 'PROCESSING'){
        console.error( `PR ${prNumber} is already in process`);
        return {skipped: true, reason: "review already in process"}
      } else if(review.status === 'FAILED'){
        await prisma.review.delete({where: {id: review.id}});
      }
    } 

    // Track review in db
    review = await prisma.review.create({
      data: {
        prNumber,
        prTitle,
        repoFullName: repositoryName,
        status: "PROCESSING",
        headSha: prHeadSha,
      },
    });

    try {
      // Fetch the PR difference from github
      const prDiff = await getPRDifference({
        repoFullName: repositoryName,
        prNumber: prNumber,
      });

      // Skip if no difference found
      if (!prDiff || prDiff.trim().length === 0) {
        await prisma.review.update({
          where: { id: review.id },
          data: { status: "SKIPPED" },
        });
        return { skipped: true, reason: "Empty diff" };
      }

      // Send difference to Groq for review
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

      console.log(
        `PR ${prNumber} Review Complete - Posted ${postedCount} comments.`,
      );

      // Update review record once processing is completed
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "COMPLETED",
          commentCount: postedCount,
          summary: reviewResponse.summary,
          tokenUsed: reviewResponse.tokensUsed,
          durationMs: Date.now() - startTime,
        },
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Failed to review PR #${prNumber}: ${errorMessage}`);
      // Log error in database
      await prisma.review.update({
        where: { id: review.id },
        data: {
          status: "FAILED",
          durationMs: Date.now() - startTime,
          error: errorMessage,
        },
      });

    }
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
