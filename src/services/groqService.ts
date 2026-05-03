import Groq from "groq-sdk";
import { groqAPIKey } from "../config";
import { buildPrompt } from "../prompts/prompt";

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
    const cleanedResponse = rawResponse.replace(/```json\n?|```/g,"").trim();
    const parsedRseponse = JSON.parse(cleanedResponse);
    return parsedRseponse;
}