const secret = process.env.WEBHOOK_SECRET;
export const redisURL = process.env.REDIS_URL || "redis://localhost:6379";
const githubToken = process.env.GITHUB_TOKEN;
const groq = process.env.GROQ_API_KEY;
if(!secret || !githubToken || !groq){
    throw new Error("Missing environment variable")
}

export const githubSecret: string = secret;
export const githubAuthToken: string = githubToken;
export const groqAPIKey: string = groq;