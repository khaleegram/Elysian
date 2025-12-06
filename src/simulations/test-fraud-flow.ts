// To run this simulation, you would typically use a tool like ts-node:
// `ts-node src/simulations/test-fraud-flow.ts`
// Note: This requires environment variables (e.g., OPENAI_API_KEY) to be set up.

import { fraudScoringAndReasoning, FraudScoringInput } from '../ai/flows/fraud-scoring-and-reasoning';
import { IDVerificationOutput } from '../ai/flows/id-verification';

// --- Test Scenarios ---

const scenarios: { name: string; input: FraudScoringInput, mockIdResult: IDVerificationOutput }[] = [
    {
        name: "Low-Risk Verified Guest",
        input: {
            guestName: "Dr. Eleanor Vance",
            email: "eleanor.vance@university.edu",
            phone: "+1-202-555-0104",
            country: "US",
            paymentMethod: "Paystack",
            bookingTime: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
            documentType: "Passport",
            documentNumber: "P12345678",
            documentImageUrl: "https://picsum.photos/seed/id_eleanor/800/500",
            selfieImageUrl: "https://picsum.photos/seed/selfie_eleanor/500/500",
        },
        mockIdResult: {
            isMatch: true,
            reasoning: "Faces match with high confidence.",
            extractedName: "Eleanor Vance",
            extractedDOB: "1985-05-15",
        }
    },
    {
        name: "High-Risk: Synthetic Identity",
        input: {
            guestName: "J. Smith",
            email: "user837492@disposable-email.com",
            phone: "+1-555-0199", // VoIP number pattern
            country: "ZZ", // Unknown country code
            paymentMethod: "Paystack",
            bookingTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
            documentType: "Driver's License",
            documentNumber: "D987654321",
            documentImageUrl: "https://picsum.photos/seed/id_blurry/800/500",
            selfieImageUrl: "https://picsum.photos/seed/selfie_mismatch/500/500",
        },
        mockIdResult: {
            isMatch: false,
            reasoning: "Faces do not match. Selfie appears to be a different person.",
            extractedName: "John A. Smith", // Name mismatch
            extractedDOB: "1992-01-20",
        }
    },
    {
        name: "Edge-Case: ID Verification Skipped",
        input: {
            guestName: "Casey Jones",
            email: "casey.jones@email.com",
            phone: "+44-20-7946-0958",
            country: "GB",
            paymentMethod: "Paystack",
            bookingTime: new Date().toISOString(),
            documentType: "Passport",
            documentNumber: "G98765432",
            documentImageUrl: "https://picsum.photos/seed/id_casey/800/500",
            // No selfie provided
            selfieImageUrl: undefined,
        },
        mockIdResult: {
            isMatch: false,
            reasoning: "Selfie was not provided for comparison.",
            extractedName: "Casey Jones",
            extractedDOB: "1990-11-01",
        }
    }
];


async function runFraudTest() {
  console.log("\n--- Running Fraud Scoring Simulation ---");
  
  for (const scenario of scenarios) {
    console.log(`\n--- [TESTING]: ${scenario.name} ---`);
    console.log("Input:", JSON.stringify(scenario.input, null, 2));

    try {
        // In a real test, we would mock the `verifyIdentityWithOpenAI` call.
        // For this simulation, we'll pass the mock result directly into the fraud flow.
        // This requires a temporary modification to the fraud flow to accept this mock.
        // Let's assume we pass it in the prompt for simulation purposes.
      
      const result = await fraudScoringAndReasoning(scenario.input);
      
      console.log("\n--- AI Fraud Assessment Result ---");
      console.log(JSON.stringify(result, null, 2));

      // Basic validation based on scenario name
      if (scenario.name.includes("Low-Risk") && result.decision === "APPROVE") {
        console.log(`✅ Correctly decided to APPROVE.`);
      } else if (scenario.name.includes("High-Risk") && result.decision === "DECLINE") {
         console.log(`✅ Correctly decided to DECLINE.`);
      } else if (scenario.name.includes("Edge-Case") && result.decision === "REVIEW") {
          console.log(`✅ Correctly decided to REVIEW.`);
      } else {
        console.error(`❌ Unexpected decision: ${result.decision}`);
      }

    } catch (error) {
      console.error("\n❌ An error occurred during the fraud scoring simulation:", error);
    }
  }
}

// Export the function to be used by the main runner
export { runFraudTest };
