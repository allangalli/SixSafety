/**
 * Safety Plan Generation and Display Page
 * Loads survey data, streams plan generation via SSE, displays final plan
 */

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SafetyPlanDisplay } from "@/components/SafetyPlanDisplay";
import type { RAGInput } from "@/types/rag";

interface StreamEvent {
  type: "status" | "plan" | "error" | "complete";
  message?: string;
  content?: string;
}

interface ErrorInfo {
  title: string;
  message: string;
  suggestion: string;
}

/**
 * Categorize errors and provide specific recovery suggestions
 */
function getErrorInfo(error: string): ErrorInfo {
  const errorLower = error.toLowerCase();

  if (errorLower.includes("api key") || errorLower.includes("unauthorized")) {
    return {
      title: "API Configuration Error",
      message: "There's an issue with the API configuration.",
      suggestion:
        "Please check that your OpenAI and Pinecone API keys are correctly configured in the environment variables.",
    };
  }

  if (errorLower.includes("pinecone") || errorLower.includes("vector")) {
    return {
      title: "Database Connection Error",
      message: "Unable to connect to the safety resources database.",
      suggestion:
        "This might be a temporary issue. Please try again in a moment. If the problem persists, contact support.",
    };
  }

  if (errorLower.includes("network") || errorLower.includes("fetch") || errorLower.includes("connection")) {
    return {
      title: "Network Error",
      message: "Unable to connect to the service.",
      suggestion:
        "Please check your internet connection and try again. If you're on a slow connection, the request may have timed out.",
    };
  }

  if (errorLower.includes("timeout")) {
    return {
      title: "Request Timeout",
      message: "The request took too long to complete.",
      suggestion:
        "The service might be experiencing high load. Please wait a moment and try again.",
    };
  }

  if (errorLower.includes("rate limit")) {
    return {
      title: "Rate Limit Exceeded",
      message: "Too many requests have been made.",
      suggestion:
        "Please wait a few minutes before trying again. This helps us maintain service quality for all users.",
    };
  }

  // Generic error
  return {
    title: "Generation Failed",
    message: error,
    suggestion:
      "An unexpected error occurred. Please try again. If the problem continues, try restarting the survey from the beginning.",
  };
}

export default function PlanPage() {
  const router = useRouter();
  const [surveyData, setSurveyData] = useState<RAGInput | null>(null);
  const [status, setStatus] = useState<string>("Initializing...");
  const [plan, setPlan] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load survey data on mount
  useEffect(() => {
    const storedData = sessionStorage.getItem("surveyData");
    if (!storedData) {
      router.push("/");
      return;
    }

    try {
      const data = JSON.parse(storedData);
      setSurveyData(data);
    } catch (error) {
      console.error("Failed to parse survey data:", error);
      setError("Invalid survey data. Please start over.");
    }
  }, [router]);

  // Start plan generation when survey data is loaded
  useEffect(() => {
    if (surveyData && !isGenerating && !plan) {
      generatePlan();
    }
  }, [surveyData]);

  const generatePlan = async () => {
    if (!surveyData) return;

    setIsGenerating(true);
    setError(null);
    setStatus("Starting plan generation...");

    try {
      const response = await fetch("/api/generate-plan", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(surveyData),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Read SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          break;
        }

        // Decode chunk
        const chunk = decoder.decode(value);
        const lines = chunk.split("\n");

        // Process each line
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event: StreamEvent = JSON.parse(line.slice(6));

              switch (event.type) {
                case "status":
                  setStatus(event.message || "Processing...");
                  break;

                case "plan":
                  if (event.content) {
                    setPlan(event.content);
                    setStatus("Complete!");
                  }
                  break;

                case "error":
                  setError(event.message || "An error occurred");
                  setStatus("Failed");
                  break;

                case "complete":
                  setIsGenerating(false);
                  break;
              }
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }
    } catch (error) {
      console.error("Failed to generate plan:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to generate safety plan"
      );
      setStatus("Failed");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRetry = () => {
    setPlan(null);
    setError(null);
    setIsGenerating(false);
    if (surveyData) {
      generatePlan();
    }
  };

  const handleStartOver = () => {
    sessionStorage.removeItem("surveyData");
    sessionStorage.removeItem("neighbourhood");
    router.push("/");
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 print:bg-white">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header - hidden in print */}
        <div className="text-center mb-8 print:hidden">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Your Personal Safety Plan
          </h1>
          {surveyData && (
            <p className="text-gray-600">{surveyData.neighbourhood}</p>
          )}
        </div>

        {/* Loading State */}
        {isGenerating && !plan && (
          <div className="bg-white rounded-lg shadow-lg p-12">
            <div className="flex flex-col items-center">
              {/* Animated spinner */}
              <div className="relative mb-8">
                <div className="animate-spin rounded-full h-20 w-20 border-b-4 border-blue-600"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="h-12 w-12 rounded-full bg-blue-100"></div>
                </div>
              </div>

              {/* Status message */}
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Generating Your Safety Plan
              </h2>
              <p className="text-gray-600 text-center max-w-md mb-6">
                {status}
              </p>

              {/* Progress steps */}
              <div className="w-full max-w-md space-y-3">
                {[
                  "Retrieving safety resources...",
                  "Analyzing safety information...",
                  "Generating personalized plan...",
                ].map((step, index) => (
                  <div
                    key={index}
                    className={`flex items-center gap-3 p-3 rounded-lg ${
                      status.includes(step.split("...")[0])
                        ? "bg-blue-50 border border-blue-200"
                        : "bg-gray-50"
                    }`}
                  >
                    {status.includes(step.split("...")[0]) ? (
                      <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full flex-shrink-0"></div>
                    ) : (
                      <div className="h-5 w-5 rounded-full bg-gray-300 flex-shrink-0"></div>
                    )}
                    <span
                      className={`text-sm ${
                        status.includes(step.split("...")[0])
                          ? "text-blue-900 font-medium"
                          : "text-gray-600"
                      }`}
                    >
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && !plan && (() => {
          const errorInfo = getErrorInfo(error);
          return (
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="text-center max-w-2xl mx-auto">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-red-600"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                </div>

                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {errorInfo.title}
                </h2>

                <p className="text-gray-700 mb-4">{errorInfo.message}</p>

                {/* Recovery suggestion */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 text-left">
                  <div className="flex items-start gap-3">
                    <svg
                      className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-blue-900 mb-1">
                        How to fix this:
                      </p>
                      <p className="text-sm text-blue-800">{errorInfo.suggestion}</p>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 justify-center">
                  <button
                    onClick={handleRetry}
                    className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-md hover:shadow-lg"
                    aria-label="Retry safety plan generation"
                  >
                    Try Again
                  </button>
                  <button
                    onClick={handleStartOver}
                    className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
                    aria-label="Return to home and start over"
                  >
                    Start Over
                  </button>
                </div>
              </div>
            </div>
          );
        })()}

        {/* Success State - Display Plan */}
        {plan && surveyData && (
          <>
            <SafetyPlanDisplay
              plan={plan}
              neighbourhood={surveyData.neighbourhood}
            />

            {/* Actions - hidden in print */}
            <div className="mt-6 flex gap-3 justify-center print:hidden">
              <button
                onClick={handleStartOver}
                className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold rounded-lg transition-colors"
              >
                ← Back to Home
              </button>
            </div>
          </>
        )}
      </div>
    </main>
  );
}
