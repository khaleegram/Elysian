// This file acts as the main entry point for running all simulations.
import { config } from 'dotenv';
config({ path: '.env.local' });

import { runBookingAgentTest } from './test-booking-agent';
import { runFraudTest } from './test-fraud-flow';
import { runLocalGuideTest } from './test-local-guide';
import { runServiceRequestTest } from './test-service-request';
import { runVibeScoreTest } from './test-vibe-score';
import { runDufTest } from './test-duf';

async function main() {
    console.log("--- Starting All ElysianAI Simulations ---");

    await runBookingAgentTest();
    await runFraudTest();
    await runServiceRequestTest();
    await runVibeScoreTest();
    await runLocalGuideTest();
    await runDufTest();
    
    console.log("\n--- All Simulations Concluded ---");
}

main().catch(err => {
    console.error("\n\nA critical error occurred during the simulation run:", err);
    process.exit(1);
});

    