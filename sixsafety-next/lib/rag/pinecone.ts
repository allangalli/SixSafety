/**
 * Pinecone Vector Store Setup
 * Connects to existing Pinecone index with Toronto Police Service safety resources
 */

import { Pinecone } from "@pinecone-database/pinecone";
import { PineconeStore } from "@langchain/pinecone";
import { getEmbeddings } from "@/lib/utils/openai";

// Validate environment variables
if (!process.env.PINECONE_API_KEY) {
  throw new Error(
    "PINECONE_API_KEY is not set. Please add it to your .env.local file."
  );
}

if (!process.env.PINECONE_INDEX) {
  throw new Error(
    "PINECONE_INDEX is not set. Please add it to your .env.local file."
  );
}

/**
 * Singleton Pinecone client instance
 */
let pineconeClient: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!pineconeClient) {
    pineconeClient = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY!,
    });
  }
  return pineconeClient;
}

/**
 * Singleton PineconeStore instance
 * Connects to existing index with safety resources
 */
let vectorStoreInstance: PineconeStore | null = null;

export async function getPineconeVectorStore(): Promise<PineconeStore> {
  if (vectorStoreInstance) {
    return vectorStoreInstance;
  }

  const pinecone = getPineconeClient();
  const indexName = process.env.PINECONE_INDEX!;

  // Get the index
  const index = pinecone.Index(indexName);

  // Create vector store with OpenAI embeddings
  vectorStoreInstance = await PineconeStore.fromExistingIndex(
    getEmbeddings(),
    {
      pineconeIndex: index,
      // Optional: specify namespace if index uses namespaces
      // namespace: "safety-resources",
    }
  );

  return vectorStoreInstance;
}

/**
 * Test connection to Pinecone index
 * Useful for debugging and health checks
 */
export async function testPineconeConnection(): Promise<{
  success: boolean;
  indexName?: string;
  dimension?: number;
  error?: string;
}> {
  try {
    const pinecone = getPineconeClient();
    const indexName = process.env.PINECONE_INDEX!;

    // Describe the index to verify connection
    const indexDescription = await pinecone.describeIndex(indexName);

    return {
      success: true,
      indexName: indexDescription.name,
      dimension: indexDescription.dimension,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
