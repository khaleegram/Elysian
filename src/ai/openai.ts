import OpenAI from 'openai';

// This file is the single source of truth for the OpenAI client.
// All AI flows should import the 'openai' instance from this file.

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  // This error will be thrown on the server if the OPENAI_API_KEY is not set.
  // It's a safeguard to prevent the app from running without its AI capabilities.
  throw new Error('The OPENAI_API_KEY environment variable is missing or empty. Please add it to your .env file.');
}

export const openai = new OpenAI({
  apiKey: apiKey,
});
