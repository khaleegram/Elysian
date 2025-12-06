
import { localGuide } from '../ai/flows/local-guide';

const prompts = [
    { name: "Specific Request", text: "Are there any good sushi places nearby?" },
    { name: "Vague Request", text: "What's fun to do around here?" },
    { name: "Family Request", text: "I need something to do with two young kids." },
];

async function runLocalGuideTest() {
  console.log("\n--- Running Local Guide Simulation ---");

  for (const prompt of prompts) {
    console.log(`\n--- [TESTING] ${prompt.name}: "${prompt.text}" ---`);
    try {
      const response = await localGuide(prompt.text);
      console.log("AI Response:");
      // Simple validation: check if the response is a non-empty string of reasonable length
      if (response && response.length > 20) {
        console.log(response);
        console.log("✅ Test Passed: AI provided a valid response.");
      } else {
        console.error("❌ Test Failed: AI response was empty or too short.");
      }
    } catch (error) {
      console.error("An error occurred during the local guide simulation:", error);
    }
  }
}

export { runLocalGuideTest };
