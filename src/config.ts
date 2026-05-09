const secret = process.env.WEBHOOK_SECRET;
export const redisURL = process.env.REDIS_URL || "redis://localhost:6379";
const githubToken = process.env.GITHUB_TOKEN;
const groq = process.env.GROQ_API_KEY;
const postgres = process.env.DATABASE_URL;
if(!secret || !githubToken || !groq || !postgres){
    throw new Error("Missing environment variable")
}

export const githubSecret: string = secret;
export const githubAuthToken: string = githubToken;
export const groqAPIKey: string = groq;
export const postGresURL: string = postgres;