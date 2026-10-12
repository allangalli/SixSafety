/**
 * OpenAI client utilities
 * Provides singleton instances for LLM and embeddings
 */

import { ChatOpenAI, OpenAIEmbeddings } from "@langchain/openai";

if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "OPENAI_API_KEY is not set. Please add it to your .env.local file."
  );
}

/**
 * Singleton ChatOpenAI instance for RAG workflow
 * Uses GPT-4-turbo-preview (same as Story 2)
 */
let chatModelInstance: ChatOpenAI | null = null;

export function getChatModel(temperature: number = 0.3): ChatOpenAI {
  if (!chatModelInstance || chatModelInstance.temperature !== temperature) {
    chatModelInstance = new ChatOpenAI({
      modelName: "gpt-4-turbo-preview",
      temperature,
      openAIApiKey: process.env.OPENAI_API_KEY,
      maxTokens: 2000,
    });
  }
  return chatModelInstance;
}

/**
 * Singleton OpenAIEmbeddings instance for vector store
 * Uses text-embedding-3-small for cost efficiency
 */
let embeddingsInstance: OpenAIEmbeddings | null = null;

export function getEmbeddings(): OpenAIEmbeddings {
  if (!embeddingsInstance) {
    embeddingsInstance = new OpenAIEmbeddings({
      modelName: "text-embedding-3-small",
      openAIApiKey: process.env.OPENAI_API_KEY,
    });
  }
  return embeddingsInstance;
}

/**
 * Create a new ChatOpenAI instance with custom configuration
 * Use this for specialized calls that need different settings
 */
export function createChatModel(config: {
  temperature?: number;
  maxTokens?: number;
  modelName?: string;
}): ChatOpenAI {
  return new ChatOpenAI({
    modelName: config.modelName || "gpt-4-turbo-preview",
    temperature: config.temperature ?? 0.3,
    maxTokens: config.maxTokens ?? 2000,
    openAIApiKey: process.env.OPENAI_API_KEY,
  });
}
