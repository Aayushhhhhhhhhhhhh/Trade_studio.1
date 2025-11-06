'use server';

/**
 * @fileOverview Generates an AI-powered summary of trading performance, highlighting strengths, weaknesses, and actionable rules for improvement.
 *
 * - generateAiTradeSummary - A function that generates the AI-powered trade summary.
 * - GenerateAiTradeSummaryInput - The input type for the generateAiTradeSummary function.
 * - GenerateAiTradeSummaryOutput - The return type for the generateAiTradeSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateAiTradeSummaryInputSchema = z.object({
  tradingData: z.string().describe('A summary of trading data, including metrics like win rate, profit factor, and equity curve.'),
  journalEntries: z.string().describe('A summary of journaling entries, containing insights into why trades were taken, mistakes made, and lessons learned.'),
});
export type GenerateAiTradeSummaryInput = z.infer<typeof GenerateAiTradeSummaryInputSchema>;

const GenerateAiTradeSummaryOutputSchema = z.object({
  summary: z.string().describe('An AI-powered summary of trading performance, highlighting strengths, weaknesses, and actionable rules for improvement.'),
});
export type GenerateAiTradeSummaryOutput = z.infer<typeof GenerateAiTradeSummaryOutputSchema>;

export async function generateAiTradeSummary(input: GenerateAiTradeSummaryInput): Promise<GenerateAiTradeSummaryOutput> {
  return generateAiTradeSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateAiTradeSummaryPrompt',
  input: {schema: GenerateAiTradeSummaryInputSchema},
  output: {schema: GenerateAiTradeSummaryOutputSchema},
  prompt: `You are an expert trading performance analyst. Analyze the provided trading data and journal entries to generate a summary of the trader's performance, highlighting strengths, weaknesses, and actionable rules for improvement.

Trading Data: {{{tradingData}}}

Journal Entries: {{{journalEntries}}}

Summary: `,
});

const generateAiTradeSummaryFlow = ai.defineFlow(
  {
    name: 'generateAiTradeSummaryFlow',
    inputSchema: GenerateAiTradeSummaryInputSchema,
    outputSchema: GenerateAiTradeSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
