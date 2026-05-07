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
    const prompt = buildPrompt({
        prTitle,
        prBody,
        prDiff
    });

    const response = await Client.chat.completions.create({
        messages: [{role: 'user', content: prompt}],
        model: "llama-3.3-70b-versatile",
        max_tokens: 2048,
        temperature: 0.2, 
    });

    const rawResponse = response.choices[0].message.content ?? "";
    let parsedRseponse: {summary: string; comments: ReviewComment[]};
    try{
        const cleanedResponse = rawResponse.replace(/```json\n?|```/g,"").trim();
        parsedRseponse = JSON.parse(cleanedResponse);

    } catch(error){
        console.error(`Failed parsing the response: ${error}`);
        parsedRseponse = {
            summary: "Review completed but could not be fully parsed. Please check the PR manually.",
            comments: [],
        };
    }
    return parsedRseponse;
}