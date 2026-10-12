"use client";

import { Shield } from 'lucide-react';

interface RealtimeSummaryProps {
  summary: string;
  visible: boolean;
}

/**
 * Display dynamic summary of user responses
 * Updates after each submission with shield icon
 */
export function RealtimeSummary({ summary, visible }: RealtimeSummaryProps) {
  if (!visible || !summary) {
    return null;
  }

  return (
    <div className="bg-notification-amber-bg border-2 border-notification-amber-border rounded-lg p-4 flex items-start gap-3 shadow-md animate-fade-in my-4">
      <Shield className="w-5 h-5 text-notification-amber-text flex-shrink-0 mt-0.5" />
      <p className="text-sm text-notification-amber-text italic">
        {summary}
      </p>
    </div>
  );
}
