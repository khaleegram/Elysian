'use server';
/**
 * @fileOverview This file implements an AI flow for analyzing and categorizing
 * a guest's service request using OpenAI.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';
import { ServiceRequestType } from '@/lib/types';

// Input schema for the service request analysis
const ServiceRequestAnalysisInputSchema = z.object({
  requestText: z.string().describe("The free-text service request from the guest."),
});
export type ServiceRequestAnalysisInput = z.infer<typeof ServiceRequestAnalysisInputSchema>;

// Output schema to ensure a structured, reliable category
const ServiceRequestAnalysisOutputSchema = z.object({
    category: z.nativeEnum(ServiceRequestType).describe("The classified category of the service request."),
    summary: z.string().describe("A brief, one-sentence summary of the guest's request for internal logs.")
});
export type ServiceRequestAnalysisOutput = z.infer<typeof ServiceRequestAnalysisOutputSchema>;


/**
 * Analyzes a guest's service request to categorize it.
 * @param input - The input object containing the raw request text.
 * @returns A promise that resolves to the structured analysis result.
 */
export async function analyzeServiceRequest(input: ServiceRequestAnalysisInput): Promise<ServiceRequestAnalysisOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are an AI assistant for a luxury hotel. Your task is to analyze a guest's service request and classify it into one of the following categories: ${Object.values(ServiceRequestType).join(', ')}.

You must return a JSON object with the following structure: { "category": "...", "summary": "..." }.
- The 'category' must be one of the predefined types.
- The 'summary' should be a concise one-sentence summary of the request.

For example:
- If the user says "I'd like to order a burger and fries", you should return: {"category": "Room Service", "summary": "Guest wants to order a burger and fries."}
- If the user says "My shower is clogged", you should return: {"category": "Maintenance", "summary": "Guest reports a clogged shower."}
- If the user says "Can I get more towels please?", you should return: {"category": "Housekeeping", "summary": "Guest is requesting extra towels."}`
        },
        {
          role: "user",
          content: `Here is the guest's request: "${input.requestText}"`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2,
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("Service request analysis AI failed to generate a response.");
    }
    
    const parsedOutput = ServiceRequestAnalysisOutputSchema.parse(JSON.parse(jsonOutput));
    return parsedOutput;

  } catch (error) {
    console.error("Error in service request analysis flow:", error);
    // Fallback to a default category in case of error
    return {
      category: ServiceRequestType.Housekeeping,
      summary: `AI analysis failed. Raw request: ${input.requestText}`
    };
  }
}
