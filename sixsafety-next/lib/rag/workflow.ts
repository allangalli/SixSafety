/**
 * LangGraph RAG Workflow
 * Three-node state graph: Retrieve → Analyze → Generate
 * Replaces legacy Python LCEL chains with cleaner LangGraph implementation
 */

import { StateGraph, END } from "@langchain/langgraph";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { getChatModel } from "@/lib/utils/openai";
import { createMultiQueryRetriever, buildRetrievalQuery } from "./retrievers";
import {
  ANALYSIS_PROMPT,
  GENERATION_PROMPT,
  formatDocumentsForPrompt,
  formatUserContext,
} from "./prompts";
import { getCache } from "@/lib/cache";
import type { RAGState, RAGInput, SafetyPlanResponse } from "@/types/rag";
import type { Document } from "@langchain/core/documents";

/**
 * Node 1: Retrieve
 * Fetches relevant documents from Pinecone using MultiQueryRetriever
 */
async function retrieveNode(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log("[RAG] Starting retrieval...");

    // Build retrieval query
    const query = buildRetrievalQuery({
      neighbourhood: state.neighbourhood,
      crime_types: state.crime_types,
      user_context: state.user_context,
    });

    // Create retriever and fetch documents
    const retriever = await createMultiQueryRetriever();
    const documents = await retriever.getRelevantDocuments(query);

    console.log(`[RAG] Retrieved ${documents.length} documents`);

    return {
      documents,
      input: query,
    };
  } catch (error) {
    console.error("[RAG] Retrieval error:", error);
    return {
      error: `Retrieval failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      documents: [],
    };
  }
}

/**
 * Node 2: Analyze
 * LLM analyzes retrieved documents and user context
 */
async function analyzeNode(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log("[RAG] Starting analysis...");

    // Check for retrieval errors
    if (state.error) {
      return { analysis: "" };
    }

    // Format documents and user context
    const formattedDocs = formatDocumentsForPrompt(state.documents);
    const formattedContext = formatUserContext(state.user_context);

    // Create analysis prompt
    const analysisPrompt = ChatPromptTemplate.fromTemplate(ANALYSIS_PROMPT);

    // Create analysis chain
    const analysisChain = analysisPrompt
      .pipe(getChatModel(0.3)) // Lower temperature for focused analysis
      .pipe(new StringOutputParser());

    // Run analysis
    const analysis = await analysisChain.invoke({
      neighbourhood: state.neighbourhood,
      crime_types: state.crime_types.join(", "),
      user_context: formattedContext,
      documents: formattedDocs,
    });

    console.log(`[RAG] Analysis complete (${analysis.length} chars)`);

    return { analysis };
  } catch (error) {
    console.error("[RAG] Analysis error:", error);
    return {
      error: `Analysis failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      analysis: "",
    };
  }
}

/**
 * Node 3: Generate
 * LLM generates formatted safety plan from analysis
 */
async function generateNode(state: RAGState): Promise<Partial<RAGState>> {
  try {
    console.log("[RAG] Starting generation...");

    // Check for previous errors
    if (state.error) {
      return { plan: "" };
    }

    // Create generation prompt
    const generationPrompt = ChatPromptTemplate.fromTemplate(GENERATION_PROMPT);

    // Create generation chain
    const generationChain = generationPrompt
      .pipe(getChatModel(0.5)) // Medium temperature for creative but consistent output
      .pipe(new StringOutputParser());

    // Run generation
    const plan = await generationChain.invoke({
      neighbourhood: state.neighbourhood,
      crime_types: state.crime_types.join(", "),
      analysis: state.analysis,
    });

    console.log(`[RAG] Generation complete (${plan.length} chars)`);

    return { plan };
  } catch (error) {
    console.error("[RAG] Generation error:", error);
    return {
      error: `Generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      plan: "",
    };
  }
}

/**
 * Create the LangGraph workflow
 * Connects the three nodes in sequence
 */
function createWorkflow() {
  // Define the state graph
  const workflow = new StateGraph<RAGState>({
    channels: {
      input: {
        value: (left?: string, right?: string) => right ?? left ?? "",
      },
      neighbourhood: {
        value: (left?: string, right?: string) => right ?? left ?? "",
      },
      crime_types: {
        value: (left?: string[], right?: string[]) => right ?? left ?? [],
      },
      user_context: {
        value: (left?: string[], right?: string[]) => right ?? left ?? [],
      },
      documents: {
        value: (left?: Document[], right?: Document[]) => right ?? left ?? [],
      },
      analysis: {
        value: (left?: string, right?: string) => right ?? left ?? "",
      },
      plan: {
        value: (left?: string, right?: string) => right ?? left ?? "",
      },
      error: {
        value: (left?: string, right?: string) => right ?? left,
      },
    },
  });

  // Add nodes
  workflow.addNode("retrieve", retrieveNode);
  workflow.addNode("analyze", analyzeNode);
  workflow.addNode("generate", generateNode);

  // Add edges (linear flow)
  workflow.setEntryPoint("retrieve");
  workflow.addEdge("retrieve", "analyze");
  workflow.addEdge("analyze", "generate");
  workflow.addEdge("generate", END);

  return workflow.compile();
}

/**
 * Main entry point for safety plan generation
 * Call this from Server Action or API route
 */
export async function generateSafetyPlan(
  input: RAGInput
): Promise<SafetyPlanResponse> {
  try {
    console.log("[RAG] Starting safety plan generation for:", input.neighbourhood);

    // Check cache first
    const cache = getCache();
    const cached = cache.get(input);
    if (cached) {
      console.log("[RAG] Returning cached plan");
      return cached;
    }

    // Create workflow
    const app = createWorkflow();

    // Initialize state
    const initialState: RAGState = {
      input: "",
      neighbourhood: input.neighbourhood,
      crime_types: input.crime_types,
      user_context: input.user_context,
      documents: [],
      analysis: "",
      plan: "",
    };

    // Run workflow
    const result = await app.invoke(initialState);

    // Check for errors
    if (result.error) {
      console.error("[RAG] Workflow error:", result.error);
      return {
        success: false,
        error: result.error,
      };
    }

    // Return success
    console.log("[RAG] Safety plan generation complete");
    const response: SafetyPlanResponse = {
      success: true,
      plan: result.plan,
    };

    // Cache the result
    cache.set(input, response);

    return response;
  } catch (error) {
    console.error("[RAG] Fatal error:", error);
    return {
      success: false,
      error: `Failed to generate safety plan: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Stream safety plan generation with progress updates
 * For use with Server-Sent Events (Story 4)
 */
export async function* streamSafetyPlan(input: RAGInput) {
  try {
    // Check cache first
    const cache = getCache();
    const cached = cache.get(input);
    if (cached && cached.success && cached.plan) {
      console.log("[RAG] Returning cached plan (streaming)");
      yield { type: "status", message: "Loading cached plan..." };
      yield { type: "plan", content: cached.plan };
      yield { type: "complete" };
      return;
    }

    yield { type: "status", message: "Retrieving safety resources..." };

    const app = createWorkflow();

    const initialState: RAGState = {
      input: "",
      neighbourhood: input.neighbourhood,
      crime_types: input.crime_types,
      user_context: input.user_context,
      documents: [],
      analysis: "",
      plan: "",
    };

    // Stream workflow execution
    let generatedPlan: string | null = null;

    for await (const step of await app.stream(initialState)) {
      const nodeKey = Object.keys(step)[0];
      const nodeData = step[nodeKey];

      if (nodeKey === "retrieve") {
        yield {
          type: "status",
          message: `Found ${nodeData.documents?.length || 0} relevant resources`,
        };
      } else if (nodeKey === "analyze") {
        yield { type: "status", message: "Analyzing safety information..." };
      } else if (nodeKey === "generate") {
        if (nodeData.plan) {
          generatedPlan = nodeData.plan;
          yield { type: "plan", content: nodeData.plan };
        }
      }

      // Check for errors
      if (nodeData.error) {
        yield { type: "error", message: nodeData.error };
        return;
      }
    }

    // Cache the generated plan
    if (generatedPlan) {
      cache.set(input, {
        success: true,
        plan: generatedPlan,
      });
    }

    yield { type: "complete" };
  } catch (error) {
    yield {
      type: "error",
      message: `Failed to generate safety plan: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}
