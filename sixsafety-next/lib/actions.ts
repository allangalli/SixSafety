"use server";

import OpenAI from "openai";
import { UISchema } from "./schemas/ui-schema";
import {
  CONVERSATIONAL_SYSTEM_PROMPT,
  UI_GENERATION_SYSTEM_PROMPT,
  CONVERSATION_EXAMPLES,
  UI_GENERATION_EXAMPLES,
} from "./prompts/conversation-prompts";

// Initialize OpenAI client
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Type for conversation history
export interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

// Server Action 1: Generate conversational response
export async function generateConversation(
  userInput: string,
  history: Message[]
): Promise<{ success: true; content: string } | { success: false; error: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local",
      };
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: CONVERSATIONAL_SYSTEM_PROMPT },
        ...CONVERSATION_EXAMPLES,
        ...history,
        { role: "user", content: userInput },
      ],
      temperature: 0.7,
      max_tokens: 200, // Reduced from 500 to force brevity and prevent multiple question sets
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return {
        success: false,
        error: "No response from LLM",
      };
    }

    return {
      success: true,
      content,
    };
  } catch (error) {
    console.error("Conversation generation error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

// Server Action 2: Generate UI schema from conversation
export async function generateUISchema(
  conversationText: string,
  exchangeNumber: number
): Promise<{ success: true; schema: any } | { success: false; error: string }> {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return {
        success: false,
        error: "OpenAI API key not configured. Please set OPENAI_API_KEY in .env.local",
      };
    }

    const contextHint = exchangeNumber === 1
      ? "\n\nThis is the FIRST exchange - you MUST include crime type selection."
      : `\n\nThis is exchange ${exchangeNumber} of 3 - crime types have already been collected.`;

    const response = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        { role: "system", content: UI_GENERATION_SYSTEM_PROMPT + contextHint },
        ...UI_GENERATION_EXAMPLES,
        { role: "user", content: `Convert this to UI schema:\n\n${conversationText}` },
      ],
      temperature: 0.3, // Lower temperature for more consistent JSON
      max_tokens: 800,
      response_format: { type: "json_object" }, // Force JSON output
    });

    const content = response.choices[0].message.content;

    if (!content) {
      return {
        success: false,
        error: "No response from LLM",
      };
    }

    // Parse and validate JSON
    const json = JSON.parse(content);
    const validated = UISchema.parse(json);

    return {
      success: true,
      schema: validated,
    };
  } catch (error) {
    console.error("UI schema generation error:", error);

    // Provide more specific error messages
    if (error instanceof SyntaxError) {
      return {
        success: false,
        error: "Invalid JSON returned from LLM. Retrying might help.",
      };
    }

    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
