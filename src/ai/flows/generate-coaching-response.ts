
'use server';

/**
 * @fileOverview Generates an AI-powered coaching response based on user query and trading data.
 *
 * - generateCoachingResponse - A function that generates the AI-powered coaching response.
 * - GenerateCoachingResponseInput - The input type for the generateCoachingResponse function.
 * - GenerateCoachingResponseOutput - The return type for the generateCoachingResponse function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateCoachingResponseInputSchema = z.object({
  userQuery: z.string().describe('The user\'s question or request.'),
  tradingData: z.string().describe('A JSON summary of trading data, including metrics like win rate, profit factor, and recent trades.'),
  journalEntries: z.string().describe('A summary of journaling entries, containing insights into why trades were taken, mistakes made, and lessons learned.'),
});
export type GenerateCoachingResponseInput = z.infer<typeof GenerateCoachingResponseInputSchema>;

const GenerateCoachingResponseOutputSchema = z.object({
  response: z.string().describe('An AI-powered response to the user\'s query, acting as a trading coach.'),
});
export type GenerateCoachingResponseOutput = z.infer<typeof GenerateCoachingResponseOutputSchema>;

export async function generateCoachingResponse(input: GenerateCoachingResponseInput): Promise<GenerateCoachingResponseOutput> {
  return generateCoachingResponseFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCoachingResponsePrompt',
  input: { schema: GenerateCoachingResponseInputSchema },
  output: { schema: GenerateCoachingResponseOutputSchema },
  prompt: `You are an expert trading coach. Your goal is to help the user understand their trading performance and improve.
  
  Analyze the provided trading data and journal entries to answer the user's query. Be concise, insightful, and encouraging.
  
  User's Query: {{{userQuery}}}
  
  Trading Data Summary: {{{tradingData}}}
  
  Journal Entries Summary: {{{journalEntries}}}
  
  Your response should be helpful and directly address the user's question, using the data provided to support your points.
  `,
});

const generateCoachingResponseFlow = ai.defineFlow(
  {
    name: 'generateCoachingResponseFlow',
    inputSchema: GenerateCoachingResponseInputSchema,
    outputSchema: GenerateCoachingResponseOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
