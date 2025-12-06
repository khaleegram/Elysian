
import { getDynamicUtilityFootprintDecision, DynamicUtilityFootprintInput } from '../ai/flows/dynamic-utility-footprint';

const scenarios: { name: string; input: DynamicUtilityFootprintInput }[] = [
    {
        name: "Guest is out for the day (Long Term Absence)",
        input: {
            roomId: "405",
            guestStayProfile: "Business traveler, typically leaves at 8:30 AM and returns around 6:00 PM.",
            lastCredentialUsage: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(), // 5 hours ago
            recentServiceRequests: ["Ordered room service for breakfast at 7:00 AM."],
            inHotelActivity: "No in-hotel facility usage detected in the last 5 hours.",
            guestPreferences: {
                preferredTemperature: 68,
            },
        }
    },
    {
        name: "Guest is at hotel gym (Short Term Absence)",
        input: {
            roomId: "212",
            guestStayProfile: "Leisure traveler, frequently visits the pool and gym.",
            lastCredentialUsage: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 minutes ago
            recentServiceRequests: [],
            inHotelActivity: "Guest's gym pass was scanned 40 minutes ago.",
            guestPreferences: {
                preferredTemperature: 72,
            },
        }
    },
    {
        name: "Guest is in the room",
        input: {
            roomId: "550",
            guestStayProfile: "Honeymoon couple, tends to stay in the room for long periods.",
            lastCredentialUsage: new Date(Date.now() - 10 * 60 * 1000).toISOString(), // 10 minutes ago
            recentServiceRequests: ["Ordered a movie 5 minutes ago."],
            inHotelActivity: "Guest is currently streaming content on the in-room entertainment system.",
             guestPreferences: {
                preferredTemperature: 70,
            },
        }
    },
];

async function runDufTest() {
  console.log("\n--- Running Dynamic Utility Footprint (DUF) Simulation ---");
  
  for (const scenario of scenarios) {
    console.log(`\n--- [TESTING]: ${scenario.name} ---`);
    try {
      const result = await getDynamicUtilityFootprintDecision(scenario.input);
      console.log("AI Decision:", JSON.stringify(result, null, 2));

      // Basic validation
      if (result.decision && result.reasoning && result.costBenefit && result.actionTrigger) {
        console.log(`✅ Test Passed: AI provided a valid DUF decision.`);
      } else {
        console.error(`❌ Test Failed: AI response was missing required fields.`);
      }

    } catch (error) {
      console.error("\n❌ An error occurred during the DUF simulation:", error);
    }
  }
}

export { runDufTest };

    