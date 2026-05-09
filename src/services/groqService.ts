import Groq from "groq-sdk";
import { groqAPIKey } from "../config";
import { buildPrompt } from "../prompts/prompt";
import { ReviewComment } from "../types";

const Client = new Groq({
    apiKey: groqAPIKey
})

interface ReviewCodeParams {
    prTitle: string,
    prBody: string | null,
    prDiff: string,
} 

export const getAIResponse = async(params: ReviewCodeParams)=>{
    const {prTitle, prBody, prDiff} = params;
    const truncatedDiff = prDiff.length > 20000 ? prDiff.slice(0,20000) + '\n... [diff truncated]': prDiff;
    const prompt = buildPrompt({
        prTitle,
        prBody,
        prDiff: truncatedDiff
    });

    const response = await Client.chat.completions.create({
        messages: [{role: 'user', content: prompt}],
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        temperature: 0.2, 
    });

    const rawResponse = response.choices[0]?.message?.content ?? "";
    const tokensUsed =
    (response.usage?.prompt_tokens ?? 0) +
    (response.usage?.completion_tokens ?? 0);
    let parsedResponse: {summary: string; comments: ReviewComment[]};
    try{
        const cleanedResponse = rawResponse.replace(/```json\n?|```/g,"").trim();
        parsedResponse = JSON.parse(cleanedResponse);

    } catch(error){
        console.error(`Failed parsing the response: ${error}`);
        parsedResponse = {
            summary: "Review completed but could not be fully parsed. Please check the PR manually.",
            comments: [],
        };
    }
    return {...parsedResponse, tokensUsed};
}