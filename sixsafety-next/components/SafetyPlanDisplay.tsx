/**
 * Safety Plan Display Component
 * Renders markdown safety plan with styling, print, and share functionality
 */

"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useState } from "react";
import { Toast, ToastType } from "./Toast";

interface SafetyPlanDisplayProps {
  plan: string;
  neighbourhood: string;
}

interface ToastState {
  show: boolean;
  message: string;
  type: ToastType;
}

export function SafetyPlanDisplay({
  plan,
  neighbourhood,
}: SafetyPlanDisplayProps) {
  const [toast, setToast] = useState<ToastState>({
    show: false,
    message: "",
    type: "info",
  });

  const showToast = (message: string, type: ToastType = "success") => {
    setToast({ show: true, message, type });
  };

  const hideToast = () => {
    setToast({ show: false, message: "", type: "info" });
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(plan);
      showToast("Safety plan copied to clipboard!", "success");
    } catch (error) {
      console.error("Failed to copy:", error);
      showToast("Failed to copy. Please try again.", "error");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Safety Plan for ${neighbourhood}`,
          text: plan.substring(0, 200) + "...",
        });
        showToast("Safety plan shared successfully!", "success");
      } catch (error) {
        // User cancelled or share failed
        if (error instanceof Error && error.name !== "AbortError") {
          // Only show error if not cancelled by user
          handleCopy(); // Fallback to copy
        }
      }
    } else {
      // Fallback to copy
      await handleCopy();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg print:shadow-none">
      {/* Header with actions - hidden in print */}
      <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between print:hidden">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Your Safety Plan
          </h2>
          <p className="text-sm text-gray-600 mt-1">{neighbourhood}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Copy safety plan to clipboard"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
              />
            </svg>
            Copy
          </button>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            aria-label="Share safety plan"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
              />
            </svg>
            Share
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            aria-label="Print safety plan"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Print
          </button>
        </div>
      </div>

      {/* Markdown content */}
      <div className="px-6 py-8 prose prose-blue max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ ...props }) => (
              <h1
                className="text-3xl font-bold text-gray-900 mb-4 mt-0"
                {...props}
              />
            ),
            h2: ({ ...props }) => (
              <h2
                className="text-2xl font-semibold text-gray-900 mb-3 mt-8 first:mt-0"
                {...props}
              />
            ),
            h3: ({ ...props }) => (
              <h3
                className="text-xl font-semibold text-gray-900 mb-2 mt-6"
                {...props}
              />
            ),
            p: ({ ...props }) => (
              <p className="text-gray-700 leading-relaxed mb-4" {...props} />
            ),
            ul: ({ ...props }) => (
              <ul className="list-disc list-inside space-y-2 mb-4" {...props} />
            ),
            ol: ({ ...props }) => (
              <ol
                className="list-decimal list-inside space-y-2 mb-4"
                {...props}
              />
            ),
            li: ({ ...props }) => (
              <li className="text-gray-700 ml-4" {...props} />
            ),
            strong: ({ ...props }) => (
              <strong className="font-semibold text-gray-900" {...props} />
            ),
            em: ({ ...props }) => (
              <em className="italic text-gray-700" {...props} />
            ),
            blockquote: ({ ...props }) => (
              <blockquote
                className="border-l-4 border-blue-500 pl-4 py-2 my-4 bg-blue-50 text-gray-700 italic"
                {...props}
              />
            ),
            code: ({ ...props }) => (
              <code
                className="bg-gray-100 text-gray-900 px-2 py-1 rounded text-sm font-mono"
                {...props}
              />
            ),
            a: ({ ...props }) => (
              <a
                className="text-blue-600 hover:text-blue-800 underline"
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              />
            ),
          }}
        >
          {plan}
        </ReactMarkdown>
      </div>

      {/* Footer - hidden in print */}
      <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-lg print:hidden">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Generated by SixSafety - Your Personal Safety Assistant
          </p>
          <p className="text-sm text-gray-500">
            {new Date().toLocaleDateString("en-CA", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
      </div>

      {/* Toast notification */}
      {toast.show && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={hideToast}
        />
      )}
    </div>
  );
}
