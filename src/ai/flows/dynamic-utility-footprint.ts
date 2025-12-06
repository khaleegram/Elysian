
'use server';
/**
 * @fileOverview The Outlier Innovation: The Dynamic Utility Footprint (DUF) System.
 * This AI flow acts as a predictive infrastructure management system, analyzing guest
 * behavior to dynamically adjust room utilities like HVAC and water heating to save
 * energy and reduce costs, while ensuring guest comfort.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';

// --- 1. Input Schema: Data points for presence prediction ---
const DynamicUtilityFootprintInputSchema = z.object({
  roomId: z.string().describe("The specific room being analyzed."),
  guestStayProfile: z.string().describe("A summary of the guest's typical behavior pattern (e.g., 'Always leaves at 8 AM, returns at 6 PM')."),
  lastCredentialUsage: z.string().describe("ISO 8601 timestamp of the last time the guest's QR/PIN was used to enter the room."),
  recentServiceRequests: z.array(z.string()).describe("A list of recent in-room service requests made by the guest."),
  inHotelActivity: z.string().describe("Summary of guest's activity elsewhere in the hotel (e.g., 'Booked a table at the restaurant for 7 PM')."),
  guestPreferences: z.object({
    preferredTemperature: z.number().describe("The guest's preferred room temperature in Fahrenheit."),
  }).describe("The guest's saved environmental preferences."),
});
export type DynamicUtilityFootprintInput = z.infer<typeof DynamicUtilityFootprintInputSchema>;

// --- 2. Output Schema: The AI's decision and reasoning ---
const DynamicUtilityFootprintOutputSchema = z.object({
  decisionType: z.string().default("Predictive Utility Action"),
  decision: z.string().describe("The specific action to be taken (e.g., 'Set Room 405 to Deep Setback Mode')."),
  reasoning: z.string().describe("A clear, bullet-pointed explanation for the decision, based on the input data."),
  costBenefit: z.string().describe("A tangible, calculated financial benefit of taking this action."),
  actionTrigger: z.string().describe("The follow-up action to be scheduled to ensure guest comfort (e.g., 'Initiate pre-conditioning at 4:30 PM')."),
});
export type DynamicUtilityFootprintOutput = z.infer<typeof DynamicUtilityFootprintOutputSchema>;


/**
 * Analyzes guest data to determine and trigger a dynamic utility footprint action.
 * This serves as the primary function to demonstrate the AI's reasoning for the judges.
 * @param input The guest and room data for analysis.
 * @returns A promise that resolves to the AI's structured decision and reasoning.
 */
export async function getDynamicUtilityFootprintDecision(input: DynamicUtilityFootprintInput): Promise<DynamicUtilityFootprintOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI-powered building management system for a luxury hotel, named ElysianAI. Your purpose is to implement the "Dynamic Utility Footprint" (DUF) system. You analyze guest behavior to make intelligent, predictive decisions about room utility usage (HVAC, water heating) to save money and energy without compromising the guest experience.

Your task is to analyze the provided data for a specific room and generate a single, actionable utility decision.

**Your Reasoning Process:**
1.  **Predict Presence:** Based on all inputs (stay profile, credential usage, recent activity), predict the guest's state for the next 1-4 hours:
    *   **High Confidence Present:** Guest is in the room.
    *   **High Confidence Absent (Short Term):** Guest is out for a short period (e.g., at the hotel gym or pool).
    *   **High Confidence Absent (Long Term):** Guest is out for the day (e.g., at a conference, sightseeing).
2.  **Select DUF Action:**
    *   If **Present**, take no action. The room should already be at the guest's preferred temperature.
    *   If **Absent (Short Term)**, trigger a "Shallow Setback": Set HVAC to a moderate offset (e.g., 75°F in summer). Maintain water heating.
    *   If **Absent (Long Term)**, trigger a "Deep Setback": Set HVAC to a maximum efficiency offset (e.g., 78°F in summer). Throttle water heater.
3.  **Formulate the Output:** You MUST return a single JSON object matching the 'DynamicUtilityFootprintOutputSchema' structure.
    *   **decision:** A clear, direct command. Example: "Set Room 405 to Deep Setback Mode (HVAC: 78°F) for the next 7 hours."
    *   **reasoning:** Your explanation for the decision. THIS MUST BE BULLET-POINTED. Start with your presence prediction, then list the evidence. Example: "Presence Prediction: High Confidence Absent (Long Term). Evidence: * Pattern Recognition indicates Guest X typically remains off-premises from 9:30 AM to 5:00 PM. * Access credential was last used at 9:35 AM. * No in-hotel requests or WiFi pings detected since 9:40 AM."
    *   **costBenefit:** A specific, calculated financial saving. Use a realistic formula, for example: $0.75 per hour of Deep Setback. Example: "Predicted energy saving is $5.25 for this 7-hour period."
    *   **actionTrigger:** A critical follow-up action to ensure guest comfort upon return. Example: "Initiate pre-conditioning at 4:30 PM (30 minutes prior to predicted 5:00 PM return) to restore preferred temperature of 70°F."

Analyze the following data and generate your DUF decision.`
        },
        {
          role: "user",
          content: `Here is the data for analysis: ${JSON.stringify(input)}`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for consistent, fact-based analysis
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("DUF AI flow failed to generate a response.");
    }
    
    // Parse and validate the output against the Zod schema.
    const parsedOutput = DynamicUtilityFootprintOutputSchema.parse(JSON.parse(jsonOutput));
    return parsedOutput;

  } catch (error) {
    console.error("Error in Dynamic Utility Footprint flow:", error);
    // In case of a system error, return a safe, default state.
    return {
      decisionType: "Predictive Utility Action",
      decision: "Maintain Current State for Room " + input.roomId,
      reasoning: "A system error occurred during analysis. Defaulting to maintaining the current room state to ensure guest comfort.",
      costBenefit: "Predicted energy saving is $0.00.",
      actionTrigger: "No action required.",
    };
  }
}
