/**
 * Retriever Configuration
 * MultiQueryRetriever generates multiple query variations for better recall
 */

import { MultiQueryRetriever } from "langchain/retrievers/multi_query";
import { getChatModel } from "@/lib/utils/openai";
import { getPineconeVectorStore } from "./pinecone";
import type { RAGInput } from "@/types/rag";

/**
 * Create MultiQueryRetriever with configured parameters
 * Generates 3 query variations, retrieves k=20 documents total
 * Matches legacy system's retrieval strategy
 */
export async function createMultiQueryRetriever() {
  const vectorStore = await getPineconeVectorStore();

  // Create base retriever from vector store
  const baseRetriever = vectorStore.asRetriever({
    k: 20, // Retrieve top 20 documents
    searchType: "similarity",
  });

  // Wrap in MultiQueryRetriever for query expansion
  const multiQueryRetriever = MultiQueryRetriever.fromLLM({
    llm: getChatModel(0.7), // Higher temperature for query diversity
    retriever: baseRetriever,
    queryCount: 3, // Generate 3 query variations
    verbose: process.env.NODE_ENV === "development", // Log queries in dev mode
  });

  return multiQueryRetriever;
}

/**
 * Build retrieval query from RAG input
 * Combines neighbourhood, crime types, and user context into search query
 */
export function buildRetrievalQuery(input: RAGInput): string {
  const parts = [
    `Neighbourhood: ${input.neighbourhood}`,
    `Crime concerns: ${input.crime_types.join(", ")}`,
  ];

  // Add user context if available
  if (input.user_context.length > 0) {
    // Take first 6 context items (3 Q&A pairs) to avoid overly long queries
    const contextSummary = input.user_context.slice(0, 6).join(" ");
    parts.push(`User context: ${contextSummary}`);
  }

  return parts.join("\n");
}

/**
 * Custom query generator prompt for MultiQueryRetriever
 * Generates variations focused on safety resources
 */
export const QUERY_GENERATOR_PROMPT = `
You are an AI assistant helping to retrieve relevant safety information from a database.

Given a user query about safety concerns in Toronto, generate 3 alternative versions of the query to retrieve relevant documents from a vector database.

Each variation should:
- Focus on different aspects of the safety concern
- Use different terminology (e.g., "auto theft" vs "vehicle theft" vs "car break-ins")
- Target different types of safety resources (prevention, emergency response, community programs)

Original query: {question}

Generate 3 alternative queries (one per line):
`.trim();
