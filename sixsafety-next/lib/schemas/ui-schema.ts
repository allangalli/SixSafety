import { z } from 'zod';

// Base UI element discriminated union
export const UIElementSchema = z.discriminatedUnion('type', [
  // Select dropdown
  z.object({
    type: z.literal('select'),
    label: z.string(),
    options: z.array(z.string()),
    required: z.boolean().optional().default(false),
  }),

  // Checkbox group (multi-select)
  z.object({
    type: z.literal('checkbox-group'),
    label: z.string(),
    options: z.array(z.string()),
  }),

  // Radio button group (single select)
  z.object({
    type: z.literal('radio-group'),
    label: z.string(),
    options: z.array(z.string()),
    required: z.boolean().optional().default(true),
  }),

  // Text input (use sparingly)
  z.object({
    type: z.literal('text'),
    label: z.string(),
    placeholder: z.string().optional(),
    required: z.boolean().optional().default(false),
  }),

  // Slider/range
  z.object({
    type: z.literal('slider'),
    label: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().optional().default(1),
    unit: z.string().optional(),
  }),
]);

// Complete UI schema from LLM
export const UISchema = z.object({
  title: z.string(),
  ui_elements: z.array(UIElementSchema).min(3), // Minimum 3 elements per exchange
});

// Type exports
export type UIElement = z.infer<typeof UIElementSchema>;
export type UISchemaType = z.infer<typeof UISchema>;

// Survey response schema
export const SurveyResponseSchema = z.record(z.string(), z.any());
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;

// Complete survey data for RAG
export const CompleteSurveySchema = z.object({
  neighbourhood: z.string(),
  crime_types: z.array(z.string()),
  user_context: z.array(z.string()),
});

export type CompleteSurvey = z.infer<typeof CompleteSurveySchema>;
