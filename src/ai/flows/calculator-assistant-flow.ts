'use server';
/**
 * @fileOverview A calculator assistant AI agent.
 *
 * - explainCalculation - A function that provides an explanation for a mathematical expression.
 */

import { ai } from '@/ai/genkit';
import {
  ExplainCalculationInputSchema,
  ExplainCalculationOutputSchema,
  type ExplainCalculationInput,
  type ExplainCalculationOutput,
} from '@/ai/flows/calculator-assistant-types';

const prompt = ai.definePrompt({
  name: 'calculatorAssistantPrompt',
  input: { schema: ExplainCalculationInputSchema },
  output: { schema: ExplainCalculationOutputSchema },
  prompt: `You are a helpful calculator assistant. 
  
  Explain the following mathematical expression in a clear and concise way. 
  
  Provide the final answer as well.
  
  Expression: \`{{{expression}}}\`
  
  Your explanation should be understandable to someone who is not a math expert.
  Break down the calculation into simple steps.
  `,
});

const calculatorAssistantFlow = ai.defineFlow(
  {
    name: 'calculatorAssistantFlow',
    inputSchema: ExplainCalculationInputSchema,
    outputSchema: ExplainCalculationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);

export async function explainCalculation(
  input: ExplainCalculationInput
): Promise<ExplainCalculationOutput> {
  return await calculatorAssistantFlow(input);
}
