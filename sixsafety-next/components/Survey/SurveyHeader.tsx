"use client";

import { Shield } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useState, useEffect } from 'react';

interface SurveyHeaderProps {
  neighbourhood: string;
  isRunning?: boolean;
}

/**
 * Survey page header with neighbourhood name and QR code
 * Matches home page branding
 */
export function SurveyHeader({ neighbourhood, isRunning = false }: SurveyHeaderProps) {
  const [currentUrl, setCurrentUrl] = useState<string>('');

  useEffect(() => {
    setCurrentUrl(window.location.origin);
  }, []);

  return (
    <div className="bg-gradient-to-br from-navy-blue via-navy-blue-dark to-navy-blue text-white py-6 px-4 mb-8 relative">
      {/* QR Code - Left Sidebar */}
      {currentUrl && (
        <div className="hidden lg:block absolute left-8 top-8">
          <div className="text-center">
            <div className="bg-white p-3 rounded-lg shadow-lg inline-block mb-2">
              <QRCodeSVG
                value={currentUrl}
                size={120}
                level="H"
                includeMargin={false}
              />
            </div>
            <p className="text-sm font-medium">Try it Yourself!</p>
          </div>
        </div>
      )}

      {/* Center Content */}
      <div className="max-w-4xl mx-auto text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <Shield className="w-8 h-8" />
          <h1 className="text-3xl font-bold">Safety Conversation</h1>
        </div>
        <p className="text-lg opacity-90">{neighbourhood}</p>
      </div>
    </div>
  );
}
