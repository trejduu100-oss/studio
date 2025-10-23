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
  
  Your task is to analyze the provided information, which can be a mathematical expression, a photo of a math problem, or both.
  
  If a photo is provided, analyze the image to identify the mathematical expression.
  If a text expression is also provided, it should be considered secondary to the photo.
  
  Explain the identified mathematical expression in a clear and concise way.
  Provide the final answer as well.
  
  Expression: \`{{{expression}}}\`
  {{#if photoDataUri}}
  Photo:
  {{media url=photoDataUri}}
  {{/if}}

  Your explanation should be understandable to someone who is not a math expert.
  Break down the calculation into simple steps.
  
  If you cannot determine the expression from the inputs, set the result to "Error" and provide an explanation of why.
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
