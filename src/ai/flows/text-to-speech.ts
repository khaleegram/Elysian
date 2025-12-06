'use server';
/**
 * @fileOverview A flow for converting text to speech using OpenAI's TTS model.
 */

import { openai } from '@/ai/openai';
import { z } from 'zod';

const TextToSpeechInputSchema = z.string();
export type TextToSpeechInput = z.infer<typeof TextToSpeechInputSchema>;

const TextToSpeechOutputSchema = z.object({
  audio: z.string().describe("A data URI of the generated audio. Format: 'data:audio/mpeg;base64,<encoded_data>'"),
});
export type TextToSpeechOutput = z.infer<typeof TextToSpeechOutputSchema>;

export async function textToSpeech(text: TextToSpeechInput): Promise<TextToSpeechOutput> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OpenAI API key is not configured.");
  }
  try {
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: "alloy",
      input: text,
    });
    
    const buffer = Buffer.from(await mp3.arrayBuffer());
    const base64Audio = buffer.toString('base64');
    
    return {
      audio: `data:audio/mpeg;base64,${base64Audio}`,
    };

  } catch (error) {
    console.error("Error in textToSpeech flow:", error);
    throw new Error("Failed to generate audio from text.");
  }
}
