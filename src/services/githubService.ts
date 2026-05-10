import { Octokit } from "@octokit/rest";
import { ReviewComment } from "../types";

interface FetchDiffParams {
  repoFullName: string;
  prNumber: number;
  octokit: Octokit
}

export async function getPRDifference({
  repoFullName,
  prNumber,
  octokit
}: FetchDiffParams): Promise<string> {

  const [owner, repo] = repoFullName.split("/");
  const response = await octokit.request(
    "GET /repos/{owner}/{repo}/pulls/{pull_number}",
    {
      owner,
      repo,
      pull_number: prNumber,
      headers: { accept: "application/vnd.github.v3.diff" },
    },
  );

  return response.data as unknown as string;
}

interface ReviewCommentParams{
    owner: string,
    repo: string,
    pull_number: number,
    headsha: string,
    summary: string,
    comments: ReviewComment[],
    octokit: Octokit
}

export async function postReviewComments({
    owner,
    repo,
    pull_number,
    headsha,
    summary,
    comments,
    octokit
}: ReviewCommentParams) {
    await octokit.rest.pulls.createReview({
        owner,
        repo,
        pull_number,
        commit_id: headsha,   
        event:"COMMENT",
        body: "Reviewed by ReviewIT bot \n"+summary,
        comments: comments.map((comment: ReviewComment)=>({
            path: comment.path,
            line: comment.line,
            side: comment.side,
            body: comment.severity+'\n'+comment.body
        }))            
    });

    return comments.length;
}
