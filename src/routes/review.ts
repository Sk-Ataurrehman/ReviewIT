import { Router, Request, Response } from "express";
import { prisma } from "../utils/prisma";

const router = Router();

interface ReviewReqParams {
  owner: string;
  repoName: string;
  prNumber: string;
}

router.get(
  "/:owner/:repoName/:prNumber",
  async (req: Request<ReviewReqParams>, res: Response) => {
    const { owner, repoName, prNumber }: ReviewReqParams = req.params;
    const pullNumber = Number(prNumber);
    try {
      const review = await prisma.review.findFirst({
        where: { repoFullName: `${owner}/${repoName}`, prNumber: pullNumber },
        orderBy: { createdAt: "desc" },
      });

      if (!review) {
        return res.status(404).json({ message: "Review doesn't exist" });
      }

      return res.status(200).json({
        message: "Review Found",
        review,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("Failed to retrieve review details: " + errorMessage);
      return res.status(500).json({message: "Failed to retrieve review details", error:errorMessage })
    }
  },
);

export { router as ReviewsRouter };
