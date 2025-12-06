// To run this simulation: `ts-node src/simulations/test-service-request.ts`
// Requires environment variables to be set up.

import { analyzeServiceRequest, ServiceRequestAnalysisInput } from '../ai/flows/service-request-analysis';
import { ServiceRequestType } from '@/lib/types';

const requests: { name: string; text: string, expected: ServiceRequestType }[] = [
    { name: "Single Maintenance Task", text: "My AC is leaking water all over the floor!", expected: ServiceRequestType.Maintenance },
    { name: "Single Room Service Task", text: "I'd like to order a steak and a glass of red wine.", expected: ServiceRequestType.RoomService },
    { name: "Single Housekeeping Task", text: "Can I get some more towels and a bar of soap?", expected: ServiceRequestType.Housekeeping },
    { name: "Ambiguous Maintenance Request", text: "Something's wrong with the bed, it's making a weird noise.", expected: ServiceRequestType.Maintenance },
    { name: "Urgent Sounding Request", text: "The toilet won't stop flushing, it's really loud!", expected: ServiceRequestType.Maintenance },
];


async function runServiceRequestTest() {
  console.log("\n--- Running Service Request Analysis Simulation ---");
  let allPassed = true;

  for (const request of requests) {
    console.log(`\n[TESTING] ${request.name}: "${request.text}"`);
    try {
        const result = await analyzeServiceRequest({ requestText: request.text });
        console.log(`  -> AI classified as: ${result.category}`);
        if (result.category === request.expected) {
            console.log(`  ✅ Correct!`);
        } else {
            console.error(`  ❌ Incorrect! Expected ${request.expected}, but got ${result.category}.`);
            allPassed = false;
        }
    } catch (error) {
        console.error("  An error occurred:", error);
        allPassed = false;
    }
  }

  if (allPassed) {
      console.log("\n🎉 All service request simulations passed successfully!");
  } else {
      console.error("\n🔥 Some service request simulations failed.");
  }
}

export { runServiceRequestTest };
