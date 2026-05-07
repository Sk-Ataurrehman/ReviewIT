import { Router, Request, Response } from "express";
import crypto from "crypto";
import { githubSecret } from "../config";
import { reviewQueue } from "../queues/reviewQueue";
import { ReviewJob } from "../types";

const router = Router();

const verifySignature = (body: Buffer,  signature: string) => {
    const computed =
        "sha256=" + crypto.createHmac("sha256", githubSecret).update(body).digest("hex");
    return crypto.timingSafeEqual(
        Buffer.from(signature, "utf8"),
        Buffer.from(computed, "utf8"),
    );
};

router.post("/", async (req: Request, res: Response) => {
    const signature = req.headers["x-hub-signature-256"] as string;

    if (!verifySignature(req.body as Buffer, signature)) {
       return res.status(401).json({ message: "Invalid signature" });
    }

    const payload = JSON.parse(req.body.toString());
    const {action,number, pull_request, repository} = payload;

    if(!["opened","reopened","synchronize"].includes(action)){
        return res.status(200).json({"message":"Request ignored"});
    }

    const job: ReviewJob = {
        action: action,
        prNumber: number,
        prHeadSha: pull_request.head.sha,
        repositoryName: repository.full_name ,
        prTitle: pull_request.title,
        prBody: pull_request.body,
    }

    await reviewQueue.add("review-pr",job,{
        attempts: 3,
        backoff: { type: "exponential", delay: 5000 },
    });

    return res.status(202).json({ message: "Review queued" });
});

export { router as WebhookRouter };