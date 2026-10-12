"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SurveyProvider, useSurvey } from "@/lib/contexts/SurveyContext";
import { ConversationContainer } from "@/components/Survey/ConversationContainer";
import { ActiveQuestionForm } from "@/components/Survey/ActiveQuestionForm";
import { SurveyHeader } from "@/components/Survey/SurveyHeader";
import { RunningIndicator } from "@/components/Survey/RunningIndicator";
import { generateConversation, generateUISchema } from "@/lib/actions";
import { formatNeighbourhoodString } from "@/lib/utils/csv-loader";
import {
  extractSectionTitle,
  removeSectionMarker,
  removeUIInstructions,
  formatResponseForAPI,
  generateSummary,
  extractQuestionLabels,
} from "@/lib/utils/conversationParser";
import type { SurveyResponse } from "@/lib/schemas/ui-schema";

function SurveyContent() {
  const router = useRouter();
  const {
    state,
    setNeighbourhood,
    addConversationMessage,
    addSectionHeader,
    addUserResponseEcho,
    setActiveQuestion,
    updateSummary,
    addApiMessage,
    addResponse,
    incrementExchange,
    markComplete,
    setLoading,
    setError,
  } = useSurvey();

  const MAX_EXCHANGES = 3;

  // Load neighbourhood from sessionStorage on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("neighbourhood");
    if (!storedData) {
      router.push("/");
      return;
    }

    try {
      const neighbourhood = JSON.parse(storedData);
      setNeighbourhood(neighbourhood);

      // Start first exchange automatically
      startConversation(neighbourhood);
    } catch (error) {
      console.error("Failed to parse neighbourhood data:", error);
      router.push("/");
    }
  }, []);

  // Start the conversation with neighbourhood context
  const startConversation = async (neighbourhood: any) => {
    setLoading(true);
    setError(null);

    try {
      const initialInput = formatNeighbourhoodString(neighbourhood);

      // Get first conversational response
      const convResult = await generateConversation(initialInput, []);

      if (!convResult.success) {
        setError(convResult.error);
        setLoading(false);
        return;
      }

      // Add to API history
      addApiMessage({
        role: "assistant",
        content: convResult.content,
      });

      // Extract section header if present
      const sectionTitle = extractSectionTitle(convResult.content);
      if (sectionTitle) {
        addSectionHeader(sectionTitle);
      }

      // Clean content (remove section markers and UI instructions) and add to conversation
      let cleanContent = removeSectionMarker(convResult.content);
      cleanContent = removeUIInstructions(cleanContent);
      addConversationMessage({
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
      });

      // Generate UI schema for first exchange (use cleaned content)
      const uiResult = await generateUISchema(cleanContent, 1);

      if (!uiResult.success) {
        setError(uiResult.error);
        setLoading(false);
        return;
      }

      setActiveQuestion({
        schema: uiResult.schema,
        sectionTitle: sectionTitle || undefined,
        questionNumber: 1,
      });
    } catch (error) {
      console.error("Error starting conversation:", error);
      setError("Failed to start survey. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values: SurveyResponse) => {
    setLoading(true);
    setError(null);

    try {
      // Save response
      addResponse(values);

      // Get question labels for echo formatting
      const questionLabels = state.activeQuestion
        ? extractQuestionLabels(state.activeQuestion.schema)
        : [];

      // Add response echo to conversation
      addUserResponseEcho(values, questionLabels);

      // Format user response for API
      const userResponse = formatResponseForAPI(values);

      // Add to API history
      addApiMessage({
        role: "user",
        content: userResponse,
      });

      // Generate and update summary
      const newResponses = [...state.responses, values];
      const summary = generateSummary(newResponses);
      updateSummary(summary);

      // Increment exchange count
      const nextExchange = state.exchangeCount + 1;
      incrementExchange();

      // Check if we've completed 3 exchanges
      if (nextExchange >= MAX_EXCHANGES) {
        markComplete();
        setActiveQuestion(null);
        setLoading(false);
        return;
      }

      // Get next conversational response
      const convResult = await generateConversation(userResponse, [
        ...state.apiHistory,
        { role: "user", content: userResponse },
      ]);

      if (!convResult.success) {
        setError(convResult.error);
        setLoading(false);
        return;
      }

      // Add to API history
      addApiMessage({
        role: "assistant",
        content: convResult.content,
      });

      // Extract section header if present
      const sectionTitle = extractSectionTitle(convResult.content);
      if (sectionTitle) {
        addSectionHeader(sectionTitle);
      }

      // Clean content (remove section markers and UI instructions) and add to conversation
      let cleanContent = removeSectionMarker(convResult.content);
      cleanContent = removeUIInstructions(cleanContent);
      addConversationMessage({
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: cleanContent,
        timestamp: new Date(),
      });

      // Generate UI schema for next exchange (use cleaned content)
      const uiResult = await generateUISchema(cleanContent, nextExchange + 1);

      if (!uiResult.success) {
        setError(uiResult.error);
        setLoading(false);
        return;
      }

      setActiveQuestion({
        schema: uiResult.schema,
        sectionTitle: sectionTitle || undefined,
        questionNumber: nextExchange + 1,
      });
    } catch (error) {
      console.error("Error processing form:", error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle survey completion
  const handleGeneratePlan = () => {
    // Prepare survey data for RAG
    const surveyData = {
      neighbourhood: state.neighbourhood?.neighbourhood || "",
      crime_types: state.neighbourhood?.crimes.map((c) => `${c.type}: ${c.risk}`) || [],
      user_context: state.responses.flatMap((response) =>
        Object.entries(response).flatMap(([key, value]) => {
          if (Array.isArray(value)) {
            return [`Q: ${key}`, `A: ${value.join(", ")}`];
          }
          return [`Q: ${key}`, `A: ${value}`];
        })
      ),
    };

    // Store for plan generation page
    sessionStorage.setItem("surveyData", JSON.stringify(surveyData));

    // Navigate to plan generation
    router.push("/plan");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Running Indicator */}
      <RunningIndicator isRunning={state.isLoading} />

      {/* Header */}
      {state.neighbourhood && (
        <SurveyHeader
          neighbourhood={state.neighbourhood.neighbourhood}
          isRunning={state.isLoading}
        />
      )}

      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Error Display */}
        {state.error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-semibold">Error:</p>
            <p>{state.error}</p>
          </div>
        )}

        {/* Conversational Container */}
        <ConversationContainer
          messages={state.conversationMessages}
          summary={state.currentSummary}
        >
          {/* Active Question Form */}
          {state.activeQuestion && !state.isComplete && (
            <ActiveQuestionForm
              schema={state.activeQuestion.schema}
              onSubmit={handleFormSubmit}
              disabled={state.isLoading}
              questionNumber={state.activeQuestion.questionNumber}
            />
          )}

          {/* Loading State */}
          {state.isLoading && !state.activeQuestion && (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-orange mx-auto mb-4"></div>
              <p className="text-gray-600">
                {state.exchangeCount === 0 ? 'Generating kick-off question...' : 'Generating next question...'}
              </p>
            </div>
          )}

          {/* Completion State */}
          {state.isComplete && (
            <div className="bg-white rounded-lg shadow-lg p-8 text-center mt-6">
              <div className="mb-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-green-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Survey Complete!</h2>
                <p className="text-gray-600 mb-6">
                  Thank you for providing this information. We're ready to generate your personalized
                  safety plan.
                </p>
              </div>

              <button
                onClick={handleGeneratePlan}
                className="bg-brand-orange hover:bg-brand-orange-hover text-white font-semibold px-8 py-4 rounded-lg text-lg transition-colors shadow-md hover:shadow-lg"
              >
                Generate My Safety Plan →
              </button>
            </div>
          )}
        </ConversationContainer>
      </div>
    </main>
  );
}

export default function SurveyPage() {
  return (
    <SurveyProvider>
      <SurveyContent />
    </SurveyProvider>
  );
}
