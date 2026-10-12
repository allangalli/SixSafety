/**
 * Types for RAG (Retrieval-Augmented Generation) workflow
 * Used by LangGraph state graph for safety plan generation
 */

import type { Document } from "@langchain/core/documents";

/**
 * Input data from survey
 * Stored in sessionStorage after survey completion
 */
export interface RAGInput {
  neighbourhood: string;
  crime_types: string[];
  user_context: string[];
}

/**
 * LangGraph state interface
 * Tracks data flow through retrieve → analyze → generate nodes
 */
export interface RAGState {
  // Input from survey
  input: string;
  neighbourhood: string;
  crime_types: string[];
  user_context: string[];

  // Retrieved documents from Pinecone
  documents: Document[];

  // Analysis output (first LLM call)
  analysis: string;

  // Final safety plan (second LLM call)
  plan: string;

  // Error tracking
  error?: string;
}

/**
 * Response from safety plan generation
 */
export interface SafetyPlanResponse {
  success: boolean;
  plan?: string;
  error?: string;
}

/**
 * Configuration for RAG workflow
 */
export interface RAGConfig {
  pineconeIndex: string;
  embeddingModel: "text-embedding-3-small" | "text-embedding-3-large";
  llmModel: string;
  retrievalK: number;
  queryCount: number;
  analysisTemperature: number;
  generationTemperature: number;
}

/**
 * Default RAG configuration matching legacy system
 */
export const DEFAULT_RAG_CONFIG: RAGConfig = {
  pineconeIndex: process.env.PINECONE_INDEX || "",
  embeddingModel: "text-embedding-3-small",
  llmModel: "gpt-4-turbo-preview",
  retrievalK: 20,
  queryCount: 3,
  analysisTemperature: 0.3,
  generationTemperature: 0.5,
};
