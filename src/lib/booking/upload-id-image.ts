'use server';

/**
 * @fileOverview This file implements the AI Booking Risk & Fraud Detection flow.
 * It acts as the main reasoning layer, synthesizing data from multiple sources
 * (Vision AI, booking data) to produce a comprehensive, auditable,
 * and explainable fraud assessment, adhering to a strict, production-ready data contract.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
import { idVerificationTool } from './id-verification';

// Input schema now includes the document image for the tool
const FraudScoringAndReasoningInputSchema = z.object({
  bookingId: z.string().describe("The unique identifier for the booking transaction."),
  guestName: z.string().describe('The full name of the guest making the booking.'),
  email: z.string().describe('The email address of the guest.'),
  phone: z.string().describe('The phone number of the guest.'),
  ipAddress: z.string().optional().describe("The IP address from which the booking was made."),
  deviceFingerprint: z.string().optional().describe("A unique identifier for the guest's device."),
  paymentMethod: z.string().describe('The payment method used (e.g., credit card, Paystack).'),
  bookingTime: z.string().describe("The ISO 8601 timestamp of when the booking was made."),
  // User-provided document details
  documentType: z.string().describe("The type of document the guest claims to have provided (e.g., 'Passport', 'NIN')."),
  documentNumber: z.string().describe("The document number provided by the guest."),
  // The documentImage is no longer passed as it's not being uploaded.
  documentImage: z.string().optional().describe("A data URI of the guest's identification document. Format: 'data:<mimetype>;base64,<encoded_data>'."),
  previousBookingsSummary: z.string().optional().describe("A summary of the guest's booking history."),
});
export type FraudScoringAndReasoningInput = z.infer<typeof FraudScoringAndReasoningInputSchema>;


// As per the professional blueprint, define the exact output schema.
const FraudScoringAndReasoningOutputSchema = z.object({
  fraud_probability: z.number().min(0).max(1).describe("A simulated fraud probability score (0.0 to 1.0) based on non-ID factors like booking patterns."),
  combined_risk_score: z.number().min(0).max(100).describe("The final, synthesized risk score from 0 to 100, heavily influenced by the ID verification result."),
  decision: z.enum(["APPROVE", "REVIEW", "DECLINE"]).describe("The final decision based on the combined risk score."),
  explanation: z.string().describe("A human-readable, multi-line explanation of the decision, formatted with bullet points for the top 3 contributing factors."),
  evidence: z.array(z.string()).describe("A list of key data points that influenced the decision (e.g., 'id_verification_status:FAILURE', 'document_type_mismatch:true')."),
  recommended_action: z.enum(["manual_review", "require_additional_docs", "auto_reject", "auto_approve"]).describe("The suggested next step for the booking engine."),
});
export type FraudScoringAndReasoningOutput = z.infer<typeof FraudScoringAndReasoningOutputSchema>;


export async function fraudScoringAndReasoning(input: FraudScoringAndReasoningInput): Promise<FraudScoringAndReasoningOutput> {
  return fraudScoringAndReasoningFlow(input);
}

const fraudScoringAndReasoningPrompt = ai.definePrompt({
  name: 'fraudScoringAndReasoningPrompt',
  input: {schema: FraudScoringAndReasoningInputSchema},
  output: {schema: FraudScoringAndReasoningOutputSchema},
  tools: [idVerificationTool],
  // Set temperature to 0 for deterministic, reliable outputs.
  config: {
    temperature: 0,
  },
  prompt: `You are the head of security for a luxury hotel chain, an expert in fraud detection. Your task is to analyze a booking and provide a comprehensive, structured risk assessment in JSON format.

**Your Process:**

1.  **Analyze Input**: Review all the provided booking data. If key data (name, email) is missing, assign a 'REVIEW' decision and explain why.
2.  **ID Verification**: The user-provided ID image is no longer available. You must make a decision without it, relying on other signals. Note in your explanation that ID verification could not be performed.
3.  **Simulate Non-ID Risk Score**: Generate a 'fraud_probability' score between 0.0 and 1.0. Base this ONLY on non-ID factors like if the booking is last-minute, from a high-risk IP, or uses an unusual payment method.
4.  **Synthesize All Data & Decide**: This is the most critical step. Analyze the booking details and the non-ID risk score together. Without ID verification, you must be more cautious.
    - If there are multiple suspicious factors (e.g., last-minute booking from a high-risk IP), the \`decision\` must be REVIEW.
5.  **Calculate Final Score**: Determine a final \`combined_risk_score\` from 0-100.
6.  **Set Decision & Action**: Based on the score, set the final \`decision\` and \`recommended_action\` using these strict rules:
    *   **Score <= 40**: Decision: "APPROVE", Action: "auto_approve"
    *   **Score 41–70**: Decision: "REVIEW", Action: "manual_review"
    *   **Score >= 71**: Decision: "DECLINE", Action: "auto_reject"
7.  **Provide Evidence**: List the key factors in the \`evidence\` array. Always include 'id_verification:skipped'.
8.  **Write Explanation**: Write a clear, concise \`explanation\`. The top 3 factors MUST be in a bulleted list. Be specific. State clearly that the decision was made without visual ID verification.

**Booking Information to Analyze:**
{{{json input}}}

Begin your analysis now and return ONLY the JSON output.
`,
});

const fraudScoringAndReasoningFlow = ai.defineFlow(
  {
    name: 'fraudScoringAndReasoningFlow',
    inputSchema: FraudScoringAndReasoningInputSchema,
    outputSchema: FraudScoringAndReasoningOutputSchema,
  },
  async input => {
    // If input is empty or missing key fields, return a default review state.
    if (!input || !input.guestName || !input.email) {
      return {
        fraud_probability: 0.6,
        combined_risk_score: 60,
        decision: "REVIEW",
        explanation: "The booking requires manual review due to a complete lack of provided booking details, which prevented a comprehensive risk assessment.\n* **Missing Booking Details**: No user, payment, or device information was provided for analysis.\n* **ID Verification Skipped**: Identity verification could not be performed as no image was provided.\n* **Simulated AutoML Score**: The simulated fraud probability is moderate, reflecting uncertainty given the lack of data.",
        evidence: ["error:missing_input_data", "id_verification:skipped"],
        recommended_action: "manual_review",
      };
    }

    const { output } = await fraudScoringAndReasoningPrompt(input);
    
    if (!output) {
      // Fallback in case the model fails to generate a valid output
      return {
        fraud_probability: 0.5,
        combined_risk_score: 50,
        decision: "REVIEW",
        explanation: "AI model failed to return a valid analysis. Manual review is required due to a system error.",
        evidence: ["error:model_output_failure"],
        recommended_action: "manual_review",
      };
    }
    return output;
  }
);