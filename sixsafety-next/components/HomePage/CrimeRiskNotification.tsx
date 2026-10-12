"use client";

import { ShieldAlert } from 'lucide-react';
import { formatCrimeRiskMessage } from '@/lib/utils/formatters';

interface Crime {
  type: string;
  risk: string;
}

interface CrimeRiskNotificationProps {
  neighbourhood: string;
  crimes: Crime[];
}

/**
 * CrimeRiskNotification - Displays crime risk information in natural language
 *
 * Features:
 * - Styled notification box with shield icon
 * - Converts crime array to natural language sentence
 * - Amber/orange background with shield icon
 *
 * Example output:
 * "In the Annex neighbourhood, you're facing high risks for Assault,
 * Break and Enter, and Robbery, with a lower risk for Auto Theft."
 */
export function CrimeRiskNotification({
  neighbourhood,
  crimes,
}: CrimeRiskNotificationProps) {
  const message = formatCrimeRiskMessage(neighbourhood, crimes);

  return (
    <div className="bg-notification-amber-bg border-2 border-notification-amber-border rounded-lg p-6 flex items-start gap-4 shadow-md animate-fade-in">
      <ShieldAlert className="w-6 h-6 text-notification-amber-text flex-shrink-0 mt-1" />
      <p className="text-notification-amber-text font-medium text-lg">
        {message}
      </p>
    </div>
  );
}
