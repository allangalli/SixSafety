"use client";

import { ArrowRight, RotateCcw } from 'lucide-react';

interface ActionButtonsProps {
  onSubmit: () => void;
  onRestart: () => void;
  disabled?: boolean;
}

/**
 * ActionButtons - Submit and Restart Session buttons
 *
 * Features:
 * - Orange Submit button (primary action)
 * - Blue Restart Session button (secondary action)
 * - Proper hover states and accessibility
 * - Disabled state for submit button
 */
export function ActionButtons({
  onSubmit,
  onRestart,
  disabled = false,
}: ActionButtonsProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
      {/* Primary Submit Button */}
      <button
        onClick={onSubmit}
        disabled={disabled}
        className={`
          px-8 py-3 rounded-lg text-lg font-semibold
          transition-all duration-200
          flex items-center gap-2
          shadow-md hover:shadow-lg
          ${
            disabled
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-brand-orange hover:bg-brand-orange-hover text-white'
          }
        `}
        aria-label="Submit and start survey"
      >
        Submit
        <ArrowRight className="w-5 h-5" />
      </button>

      {/* Secondary Restart Button */}
      <button
        onClick={onRestart}
        className="
          px-8 py-3 rounded-lg text-lg font-semibold
          bg-transparent border-2 border-brand-blue text-brand-blue
          hover:bg-brand-blue hover:text-white
          transition-all duration-200
          flex items-center gap-2
          shadow-sm hover:shadow-md
        "
        aria-label="Restart session"
      >
        <RotateCcw className="w-5 h-5" />
        Restart Session
      </button>
    </div>
  );
}
