
'use server';
/**
 * @fileOverview This file implements an AI flow for verifying a user's identity
 * by comparing a selfie to an identification document using OpenAI's vision model.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';


// Input schema for the ID verification flow
const IDVerificationInputSchema = z.object({
  documentImageUrl: z.string().url().describe("The URL of the guest's identification document image."),
  selfieImageUrl: z.string().url().optional().describe("The URL of the guest's live selfie image."),
});
export type IDVerificationInput = z.infer<typeof IDVerificationInputSchema>;


// Output schema for the ID verification flow, ensuring a structured response.
const IDVerificationOutputSchema = z.object({
  isMatch: z.boolean().describe("True if the face in the selfie is a confident match to the face in the ID document, false otherwise."),
  reasoning: z.string().describe("A brief, one-sentence explanation for the decision (e.g., 'Faces match across both images', 'Low confidence in facial similarity due to poor lighting')."),
  extractedName: z.string().nullable().describe("The full name extracted from the ID document, or null if not found."),
  extractedDOB: z.string().nullable().describe("The date of birth extracted from the ID document in YYYY-MM-DD format, or null if not found."),
});
export type IDVerificationOutput = z.infer<typeof IDVerificationOutputSchema>;


/**
 * Verifies a user's identity by comparing their selfie to their ID document.
 * @param input - The input object containing URLs for the document and selfie images.
 * @returns A promise that resolves to the structured verification result.
 */
export async function verifyIdentityWithOpenAI(input: IDVerificationInput): Promise<IDVerificationOutput> {
  try {
    const userMessages: any[] = [
        {
          type: "text",
          text: "Please verify if the person in this selfie matches the person on this ID document and extract the requested information. The first image is the ID, the second is the selfie."
        },
        {
          type: "image_url",
          image_url: {
            "url": input.documentImageUrl,
          },
        },
    ];

    if (input.selfieImageUrl) {
        userMessages.push({
            type: "image_url",
            image_url: {
                "url": input.selfieImageUrl,
            },
        });
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4o", // This model supports vision
      messages: [
        {
          role: "system",
          content: `You are an AI-powered identity verification service. Your task is to compare two images: a selfie and an identification document (like a passport or driver's license).

You must perform two tasks:
1.  **Facial Comparison**: Determine if the person in the selfie is the same person whose photo is on the ID document. If no selfie is provided, you must skip this step and set 'isMatch' to false.
2.  **Data Extraction**: Extract the full name and date of birth (in YYYY-MM-DD format) from the ID document.

Based on your analysis, you MUST return a JSON object with the following structure: {isMatch: boolean, reasoning: string, extractedName: string | null, extractedDOB: string | null}.
- Set \`isMatch\` to \`true\` only if you are highly confident the faces match.
- If no selfie is provided, set \`isMatch\` to \`false\` and set the reasoning to 'Selfie was not provided for comparison'.
- If the ID is blurry, unreadable, or the faces are unclear, set \`isMatch\` to \`false\` and explain why in the \`reasoning\`.
- If you cannot find a name or date of birth, return \`null\` for that field.`
        },
        {
          role: "user",
          content: userMessages,
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for factual, deterministic output
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("ID verification AI failed to generate a response.");
    }
    
    const parsedOutput = IDVerificationOutputSchema.parse(JSON.parse(jsonOutput));
    return parsedOutput;

  } catch (error) {
    console.error("Error in ID verification flow:", error);
    // Return a default "no match" state in case of any system error
    return {
      isMatch: false,
      reasoning: "Could not perform identity verification due to a system error.",
      extractedName: null,
      extractedDOB: null,
    };
  }
}
