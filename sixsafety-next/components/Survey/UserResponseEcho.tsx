"use client";

import { AlertCircle } from 'lucide-react';
import type { SurveyResponse } from '@/lib/schemas/ui-schema';
import { formatResponseForDisplay } from '@/lib/utils/conversationParser';

interface UserResponseEchoProps {
  response: SurveyResponse;
  questionLabels?: string[];
}

/**
 * Red notification box that echoes user's response after submission
 * Shows in format: "Question: Answer; Question2: Answer2;"
 */
export function UserResponseEcho({ response, questionLabels }: UserResponseEchoProps) {
  const formattedResponse = formatResponseForDisplay(response, questionLabels);

  return (
    <div className="bg-notification-red-bg border-2 border-notification-red-border rounded-lg p-4 flex items-start gap-3 shadow-md animate-fade-in mb-4">
      <AlertCircle className="w-5 h-5 text-notification-red-text flex-shrink-0 mt-0.5" />
      <p className="text-sm text-notification-red-text font-medium">
        {formattedResponse}
      </p>
    </div>
  );
}
