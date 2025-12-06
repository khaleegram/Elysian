# AI Flow Simulations

This directory contains scripts to test the various AI flows used in the ElysianAI application. These simulations allow you to validate the logic, prompts, and outputs of individual AI systems without needing to interact with the user interface.

## Prerequisites

1.  **Environment Variables**: Ensure your `.env.local` file (or your environment) has the `OPENAI_API_KEY` set.
2.  **Dependencies**: Make sure you have run `npm install` and that `ts-node` is available.

## How to Run Simulations

A convenient script has been added to `package.json` to run all simulations at once.

From your project's root directory, run the following command:

```bash
npm run dev:sims
```

This command will execute the `src/simulations/run-all.ts` script, which imports and runs each individual test file in sequence, printing the results to your console.

### Individual Test Files

-   **`test-booking-agent.ts`**: Runs a simplified, linear conversation with the booking agent to ensure it can follow a basic booking flow.
-   **`test-fraud-flow.ts`**: Tests the fraud detection and ID verification flow with multiple scenarios (low-risk, high-risk, etc.) to validate the AI's decision-making.
-   **`test-local-guide.ts`**: Runs several prompts against the virtual concierge to check for valid, helpful responses.
-   **`test-service-request.ts`**: Validates the AI's ability to correctly categorize free-text service requests.
-   **`test-vibe-score.ts`**: Checks if the AI can accurately predict guest satisfaction based on different activity logs.
