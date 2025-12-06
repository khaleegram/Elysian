
import { bookingAgent } from '../ai/flows/booking-agent';

async function runBookingAgentTest() {
  console.log("\n--- Running Booking Agent Simulation (Simple Flow) ---");
  
  // A unique ID for this simulation user
  const simulationUserId = `sim-user-${Date.now()}`;

  // 1. Initial greeting
  console.log("\n--- [STEP 1]: Initial Interaction ---");
  const initialResponse = await bookingAgent(simulationUserId, "Hi there!");
  console.log("AI:", initialResponse.response);
  if (initialResponse.response.toLowerCase().includes("welcome")) {
    console.log("✅ Correctly initiated conversation.");
  } else {
    console.error("❌ Failed to get a proper greeting.");
    return;
  }

  // 2. Provide dates
  console.log("\n--- [STEP 2]: Provide Dates ---");
  console.log("User: 'I'd like to book a room for this weekend.'");
  const dateResponse = await bookingAgent(simulationUserId, "I'd like to book a room for this weekend.");
  console.log("AI:", dateResponse.response);
  if (dateResponse.response.toLowerCase().includes("what kind of room")) {
    console.log("✅ Correctly parsed dates and asked for room type.");
  } else {
    console.error("❌ Failed to parse dates or ask for next step.");
    return;
  }

  // 3. Provide room type
  console.log("\n--- [STEP 3]: Provide Room Type ---");
  console.log("User: 'A Deluxe room please.'");
  const roomResponse = await bookingAgent(simulationUserId, "A Deluxe room please.");
  console.log("AI:", roomResponse.response);
   if (roomResponse.response.toLowerCase().includes("found a deluxe room") || roomResponse.response.toLowerCase().includes("room available")) {
    console.log("✅ Correctly found available rooms and presented them.");
  } else {
    console.error("❌ Failed to find or present available rooms.");
    return;
  }

  // 4. Confirm Booking
  console.log("\n--- [STEP 4]: Confirm Booking ---");
  console.log("User: 'Yes, book it!'");
  const confirmResponse = await bookingAgent(simulationUserId, "Yes, book it!");
  console.log("AI:", confirmResponse.response);
  if (confirmResponse.bookingId && confirmResponse.response.toLowerCase().includes("confirmed")) {
    console.log(`✅ Booking confirmed successfully! Booking ID: ${confirmResponse.bookingId}`);
  } else {
    console.error("❌ Failed to get final booking confirmation from AI.");
  }
}

export { runBookingAgentTest };
