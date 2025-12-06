
'use server';
/**
 * @fileOverview Implements an AI flow to assign an available staff member
 * to a new service request based on their role.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';
import { ServiceRequestType, Staff } from '@/lib/types';
import { createAssignment, setStaffAvailability } from '@/lib/data';

// Input schema for the staff assignment flow
const StaffAssignmentInputSchema = z.object({
  serviceRequestId: z.string().describe("The unique ID of the service request."),
  requestType: z.nativeEnum(ServiceRequestType).describe("The category of the service request."),
  requestDescription: z.string().describe("The detailed description of the service request."),
  availableStaff: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      staffType: z.nativeEnum(ServiceRequestType),
      isAvailable: z.boolean(),
    })
  ).describe("A list of currently available staff members who match the request type."),
});
export type StaffAssignmentInput = z.infer<typeof StaffAssignmentInputSchema>;

// Output schema for the flow
const StaffAssignmentOutputSchema = z.object({
  assignedStaffId: z.string().describe("The ID of the staff member assigned to the task."),
  reasoning: z.string().describe("A brief explanation for why this staff member was chosen."),
});
export type StaffAssignmentOutput = z.infer<typeof StaffAssignmentOutputSchema>;


/**
 * Assigns a service request to the most suitable available staff member.
 * @param input The details of the request and available staff.
 * @returns A promise that resolves to the assignment details.
 */
export async function assignStaffToRequest(input: StaffAssignmentInput): Promise<StaffAssignmentOutput> {
  // If there are no available staff, we cannot proceed.
  if (input.availableStaff.length === 0) {
    throw new Error(`No available staff of type ${input.requestType} to assign.`);
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4.1",
      messages: [
        {
          role: "system",
          content: `You are an AI dispatcher for a luxury hotel. Your job is to assign a new service request to the best available staff member.

Your criteria for assignment is simple:
1.  The staff member's 'staffType' MUST match the 'requestType'.
2.  You should pick the first available staff member from the provided list.

You MUST return a JSON object with the following structure: { "assignedStaffId": "...", "reasoning": "..." }.
- 'assignedStaffId' must be the ID of one of the staff members from the 'availableStaff' list.
- 'reasoning' should be a simple sentence explaining the choice, e.g., "Assigned to the first available Housekeeping staff."`
        },
        {
          role: "user",
          content: `Here is the request and the list of available staff: ${JSON.stringify(input)}`
        },
      ],
      response_format: { type: "json_object" },
      temperature: 0.1, // Low temperature for deterministic assignment
    });

    const jsonOutput = response.choices[0].message.content;
    if (!jsonOutput) {
        throw new Error("Staff assignment AI failed to generate a response.");
    }
    
    const parsedOutput = StaffAssignmentOutputSchema.parse(JSON.parse(jsonOutput));

    // --- Critical Post-AI Actions ---
    // 1. Create the assignment record in the database.
    await createAssignment({
        serviceRequestId: input.serviceRequestId,
        staffId: parsedOutput.assignedStaffId,
    });

    // 2. Mark the assigned staff member as unavailable for future assignments.
    await setStaffAvailability(parsedOutput.assignedStaffId, false);

    return parsedOutput;

  } catch (error) {
    console.error("Error in assignStaffToRequest flow:", error);
    // In case of an error, we don't assign anyone and the request remains pending.
    throw new Error("Failed to process staff assignment via AI.");
  }
}
