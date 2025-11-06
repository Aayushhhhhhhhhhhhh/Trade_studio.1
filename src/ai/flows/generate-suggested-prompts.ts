'use server';

/**
 * @fileOverview Generates personalized prompt suggestions for the AI Coach based on user trading data.
 *
 * - generateSuggestedPrompts - A function that generates an array of prompt suggestions.
 * - GenerateSuggestedPromptsInput - The input type for the generateSuggestedPrompts function.
 * - GenerateSuggestedPromptsOutput - The return type for the generateSuggestedPrompts function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateSuggestedPromptsInputSchema = z.object({
  tradingData: z.string().describe('A JSON summary of trading data, including metrics like win rate, profit factor, and recent trades.'),
  journalEntries: z.string().describe('A summary of journaling entries, containing insights into why trades were taken, mistakes made, and lessons learned.'),
});
export type GenerateSuggestedPromptsInput = z.infer<typeof GenerateSuggestedPromptsInputSchema>;

const GenerateSuggestedPromptsOutputSchema = z.object({
  prompts: z.array(z.string()).length(3).describe('An array of exactly 3 personalized questions a user could ask their AI trading coach.'),
});
export type GenerateSuggestedPromptsOutput = z.infer<typeof GenerateSuggestedPromptsOutputSchema>;

export async function generateSuggestedPrompts(input: GenerateSuggestedPromptsInput): Promise<GenerateSuggestedPromptsOutput> {
  return generateSuggestedPromptsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateSuggestedPromptsPrompt',
  input: { schema: GenerateSuggestedPromptsInputSchema },
  output: { schema: GenerateSuggestedPromptsOutputSchema },
  prompt: `You are an expert trading coach analyzing a trader's performance. Based on the following data, generate exactly three insightful and personalized questions that the user could ask to improve their trading. The questions should be concise and directly related to potential weaknesses or patterns in their data. Frame them as if the user is asking them.

Do not include any quotation marks in the output.

Trading Data Summary: {{{tradingData}}}

Journal Entries Summary: {{{journalEntries}}}
`,
});

const generateSuggestedPromptsFlow = ai.defineFlow(
  {
    name: 'generateSuggestedPromptsFlow',
    inputSchema: GenerateSuggestedPromptsInputSchema,
    outputSchema: GenerateSuggestedPromptsOutputSchema,
  },
  async input => {
    const { output } = await prompt(input);
    return output!;
  }
);
