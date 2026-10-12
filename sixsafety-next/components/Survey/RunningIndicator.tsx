"use client";

import { Loader2 } from 'lucide-react';

interface RunningIndicatorProps {
  isRunning: boolean;
}

/**
 * Show "RUNNING... Stop" indicator during AI processing
 * Positioned in top-right corner
 */
export function RunningIndicator({ isRunning }: RunningIndicatorProps) {
  if (!isRunning) {
    return null;
  }

  return (
    <div className="fixed top-4 right-4 bg-navy-blue text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2 z-50">
      <Loader2 className="w-4 h-4 animate-spin" />
      <span className="text-sm font-medium">RUNNING...</span>
      <button className="text-xs hover:underline ml-2">Stop</button>
    </div>
  );
}
