"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { BrandedHeader } from '@/components/HomePage/BrandedHeader';
import { NeighbourhoodSelector } from '@/components/HomePage/NeighbourhoodSelector';
import { CrimeRiskNotification } from '@/components/HomePage/CrimeRiskNotification';
import { ActionButtons } from '@/components/HomePage/ActionButtons';
import type { NeighbourhoodStats } from '@/lib/utils/csv-loader';

/**
 * HomePage - Branded home page for SixSafety
 *
 * Features:
 * - Navy blue branded background with Toronto Police badge
 * - QR code sidebar for easy sharing
 * - Neighbourhood selector with crime counts
 * - Natural language crime risk notification
 * - Orange Submit and Blue Restart Session buttons
 */
export default function HomePage() {
  const router = useRouter();
  const [selectedNeighbourhood, setSelectedNeighbourhood] = useState<NeighbourhoodStats | null>(null);
  const [selectedName, setSelectedName] = useState<string>('');

  const handleNeighbourhoodSelect = (stats: NeighbourhoodStats) => {
    setSelectedNeighbourhood(stats);
    setSelectedName(stats.neighbourhood);
  };

  const handleSubmit = () => {
    if (selectedNeighbourhood) {
      // Store in sessionStorage for survey page
      sessionStorage.setItem('neighbourhood', JSON.stringify(selectedNeighbourhood));
      router.push('/survey');
    }
  };

  const handleRestart = () => {
    // Clear all session storage and reset state
    sessionStorage.clear();
    setSelectedNeighbourhood(null);
    setSelectedName('');
    // Force page reload to reset all state
    window.location.reload();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-navy-blue via-navy-blue-dark to-navy-blue">
      {/* Branded Header with QR Code */}
      <BrandedHeader />

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Neighbourhood Selector */}
        <div className="mb-8">
          <NeighbourhoodSelector
            onSelect={handleNeighbourhoodSelect}
            selected={selectedName}
          />
        </div>

        {/* Crime Risk Notification - Shows when neighbourhood selected */}
        {selectedNeighbourhood && (
          <div className="mb-8">
            <CrimeRiskNotification
              neighbourhood={selectedNeighbourhood.neighbourhood}
              crimes={selectedNeighbourhood.crimes}
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mb-8">
          <ActionButtons
            onSubmit={handleSubmit}
            onRestart={handleRestart}
            disabled={!selectedNeighbourhood}
          />
        </div>

        {/* Footer */}
        <footer className="mt-16 text-center text-sm text-white/60">
          <p>
            Powered by Toronto Police Service crime prevention resources
          </p>
          <p className="mt-2">
            For emergencies, always call 911
          </p>
        </footer>
      </div>
    </main>
  );
}
