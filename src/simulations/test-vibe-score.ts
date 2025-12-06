// To run this simulation: `ts-node src/simulations/test-vibe-score.ts`
// Requires environment variables to be set up.

import { predictVibeScore, VibeScoreInput } from '../ai/flows/vibe-score-predictor';


const scenarios: { name: string; input: VibeScoreInput, expectedRisk: 'Low' | 'High' | 'Critical' }[] = [
    {
        name: "Potentially Unhappy Guest",
        input: {
            activitySummary: `
                - Guest: Jane Smith, Room 305
                - Booking Details: Checked in 1 day ago.
                - Service Requests:
                - 18 hours ago: "The TV remote isn't working." (Status: Completed)
                - 2 hours ago: "The TV remote is still not working. Can someone please fix this? I want to watch the game." (Status: Pending)
                - Messages: None
            `,
        },
        expectedRisk: "High"
    },
    {
        name: "Happy Guest",
        input: {
            activitySummary: `
                - Guest: Bob Johnson, Room 410
                - Booking Details: Checked in 2 days ago.
                - Service Requests:
                - 1 day ago: "I'd like to order a bottle of champagne." (Status: Completed)
                - Messages: "Thank you for the quick service!"
            `,
        },
        expectedRisk: "Low"
    },
     {
        name: "Mixed Activity Guest",
        input: {
            activitySummary: `
                - Guest: Maria Garcia, Room 201
                - Booking Details: Checked in 6 hours ago.
                - Service Requests:
                - 5 hours ago: "The room is a bit cold, can we adjust the A/C?" (Status: Completed)
                - 1 hour ago: "The restaurant recommendation was amazing! Thank you." (Message)
                - 30 minutes ago: "We seem to be out of coffee pods for the machine." (Status: Pending)
            `,
        },
        expectedRisk: "Low" // Should be low, but AI should still suggest action.
    }
];

async function runVibeScoreTest() {
  console.log("\n--- Running Vibe Score Prediction Simulation ---");

  for (const scenario of scenarios) {
    console.log(`\n--- [TESTING]: ${scenario.name} ---`);
    try {
        const result = await predictVibeScore(scenario.input);
        console.log(JSON.stringify(result, null, 2));

        if (scenario.expectedRisk === 'Low' && result.vibeScore > 6) {
            console.log("✅ Simulation Successful: Correctly identified a positive or neutral vibe score.");
        } else if (scenario.expectedRisk !== 'Low' && result.vibeScore < 7) {
            console.log("✅ Simulation Successful: Correctly identified a low vibe score.");
        } else {
             console.error(`❌ Simulation Failed: Vibe score ${result.vibeScore} was not in the expected range.`);
        }

    } catch (error) {
        console.error("\n❌ An error occurred during the vibe score simulation:", error);
    }
  }
}

export { runVibeScoreTest };
