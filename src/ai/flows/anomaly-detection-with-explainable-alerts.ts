'use server';
/**
 * @fileOverview This file implements an AI flow for detecting anomalies
 * in hotel operational data and providing clear, explainable alerts.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';
import { Booking, ServiceRequest } from '@/lib/types';

// Input schema for the anomaly detection flow
const AnomalyDetectionInputSchema = z.object({
  recentBookings: z.array(z.any()).describe("A list of booking objects from the last 24-48 hours."),
  recentServiceRequests: z.array(z.any()).describe("A list of service request objects from the last 24-48 hours."),
});
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

// Output schema for a single detected anomaly
const AnomalySchema = z.object({
    title: z.string().describe("A short, descriptive title for the anomaly (e.g., 'High Maintenance Requests for Room 402')."),
    severity: z.enum(["Low", "Medium", "High", "Critical"]).describe("The severity level of the detected anomaly."),
    explanation: z.string().describe("A clear, concise explanation of why this pattern is considered anomalous and what its potential impact is."),
    suggestedAction: z.string().describe("A concrete, actionable suggestion for an administrator (e.g., 'Dispatch maintenance to inspect Room 402 plumbing and electrical systems.')."),
    relatedIds: z.array(z.string()).describe("A list of relevant document IDs (e.g., booking IDs or room numbers).")
});

// Output schema for the entire flow
const AnomalyDetectionOutputSchema = z.object({
  anomalies: z.array(AnomalySchema).describe("A list of detected anomalies. If no anomalies are found, this list will be empty."),
});
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;


/**
 * Analyzes operational data to find and report on anomalies.
 * @param input The operational data to analyze.
 * @returns A promise that resolves to a list of detected anomalies.
 */
export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1-turbo",
      messages: [
        {
          role: "system",
          content: `You are an AI-powered operational analyst for a luxury hotel chain. Your task is to detect anomalies in recent operational data (bookings, service requests) that might indicate a problem.

You must analyze the provided JSON data and identify patterns that deviate from the norm. Examples of anomalies include:
- A single room having an unusually high number of maintenance requests in a short period.
- A sudden spike in bookings from a single IP address or with similar, slightly-off names.
- An unusual number of declined bookings or high fraud scores from a specific region.
- A cluster of housekeeping requests for the same issue across multiple rooms on the same floor.

For each anomaly you detect, you must provide a structured object. If you find no anomalies, return an empty list.

Your entire response MUST be a single JSON object with a single key "anomalies", which is a list of the anomalies you found.`
        },
        {
          role: "user",
          content: `Please analyze the following operational data for anomalies: ${JSON.stringify(input)}`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Low temperature for consistent, fact-based analysis
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("Anomaly detection AI failed to generate a response.");
    }
    
    // The model is instructed to return the full object, so we parse it directly.
    const parsedOutput = AnomalyDetectionOutputSchema.parse(JSON.parse(jsonOutput));
    return parsedOutput;

  } catch (error) {
    console.error("Error in anomaly detection flow:", error);
    // In case of a system error, return an empty list to avoid breaking the UI.
    return {
      anomalies: [],
    };
  }
}
