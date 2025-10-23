/**
 * @fileOverview Types for the calculator assistant AI agent.
 *
 * - ExplainCalculationInputSchema - The Zod schema for the input to the explainCalculation function.
 * - ExplainCalculationInput - The input type for the explainCalculation function.
 * - ExplainCalculationOutputSchema - The Zod schema for the output of the explainCalculation function.
 * - ExplainCalculationOutput - The return type for the explainCalculation function.
 */

import { z } from 'zod';

export const ExplainCalculationInputSchema = z.object({
  expression: z.string().describe('The mathematical expression to explain.'),
});
export type ExplainCalculationInput = z.infer<
  typeof ExplainCalculationInputSchema
>;

export const ExplainCalculationOutputSchema = z.object({
  explanation: z
    .string()
    .describe('The step-by-step explanation of the calculation.'),
  result: z.string().describe('The final result of the calculation.'),
});
export type ExplainCalculationOutput = z.infer<
  typeof ExplainCalculationOutputSchema
>;
