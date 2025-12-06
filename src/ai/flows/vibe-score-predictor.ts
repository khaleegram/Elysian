'use server';
/**
 * @fileOverview This file implements an AI flow for predicting guest satisfaction ("Vibe Score").
 * It analyzes a summary of guest activity to generate a score, risk level, and proactive suggestions.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';

// Input schema for the vibe score prediction
const VibeScoreInputSchema = z.object({
  activitySummary: z.string().describe("A summary of the guest's recent interactions, including service requests, messages, and booking details."),
});
export type VibeScoreInput = z.infer<typeof VibeScoreInputSchema>;

// Output schema to ensure a structured, actionable response
const VibeScoreOutputSchema = z.object({
  vibeScore: z.number().min(1).max(10).describe("A score from 1-10 representing predicted guest satisfaction (1=Very Unhappy, 10=Very Happy)."),
  escalationRisk: z.enum(["Low", "Medium", "High", "Critical"]).describe("The predicted risk of the guest escalating a complaint."),
  reasoning: z.string().describe("A brief, bulleted explanation for the current vibe score, highlighting key positive or negative signals."),
  suggestedAction: z.string().describe("A proactive, concrete, and simple action for staff to take to improve the guest's experience (e.g., 'Send a complimentary drink to their room', 'Offer a late checkout')."),
});
export type VibeScoreOutput = z.infer<typeof VibeScoreOutputSchema>;

/**
 * Predicts a guest's satisfaction score and provides actionable insights.
 * @param input - The input object containing the summary of guest activity.
 * @returns A promise that resolves to the structured vibe score prediction.
 */
export async function predictVibeScore(input: VibeScoreInput): Promise<VibeScoreOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are an expert AI in hospitality management, specialized in guest satisfaction analysis. Your task is to predict a "Vibe Score" for a hotel guest based on a summary of their recent activity.

Your analysis MUST produce a JSON object with the following structure: { "vibeScore": number, "escalationRisk": "Low" | "Medium" | "High" | "Critical", "reasoning": string, "suggestedAction": string }.

**Vibe Score Scale:**
- 1-3: Critical (Guest is extremely dissatisfied, immediate action required).
- 4-6: Unhappy (Guest is experiencing issues that need attention).
- 7-8: Neutral/Content (Things are okay, but could be better).
- 9-10: Happy (Guest is having a great experience).

**Analysis Guidelines:**
1.  **Analyze Signals**: Carefully review the \`activitySummary\`.
    - Negative signals: Frequent maintenance requests, complaints, negative language in messages, multiple requests for the same thing.
    - Positive signals: Positive feedback, room service orders, inquiries about local attractions.
    - Lack of interaction is neutral, but could be a negative sign if it's unusual for the guest.
2.  **Determine Score & Risk**: Based on the signals, assign a \`vibeScore\` and an \`escalationRisk\`. Multiple negative signals should lead to a low score and high risk.
3.  **Provide Reasoning**: The \`reasoning\` should be a concise, bulleted list explaining *why* you assigned the score.
4.  **Suggest Action**: The \`suggestedAction\` is CRITICAL. It must be a simple, concrete, and proactive step a hotel staff member can take *right now*. Examples: "Send a complimentary bottle of wine to their room with a note," "Call the guest to personally check if the maintenance issue was resolved to their satisfaction," "Offer a complimentary late check-out." Avoid generic advice like "improve service."`
        },
        {
          role: "user",
          content: `Analyze the following guest activity and provide a Vibe Score analysis: \n\n${input.activitySummary}`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("Vibe Score AI failed to generate a response.");
    }
    
    const parsedOutput = VibeScoreOutputSchema.parse(JSON.parse(jsonOutput));
    return parsedOutput;

  } catch (error) {
    console.error("Error in Vibe Score prediction flow:", error);
    // Fallback to a default neutral state in case of error
    return {
      vibeScore: 7,
      escalationRisk: "Low",
      reasoning: "Could not perform analysis due to a system error.",
      suggestedAction: "No action suggested due to system error."
    };
  }
}
