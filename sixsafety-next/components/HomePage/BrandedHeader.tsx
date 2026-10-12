"use client";

import { QRCodeSVG } from 'qrcode.react';
import { useEffect, useState } from 'react';

interface BrandedHeaderProps {
  className?: string;
}

/**
 * BrandedHeader - Displays Toronto Police Services branding and QR code
 *
 * Features:
 * - Toronto Police badge (placeholder for now - needs official asset)
 * - QR code on left sidebar with "Try it Yourself!" text
 * - Navy blue branded background
 * - Responsive design (QR code hides on mobile)
 */
export function BrandedHeader({ className = '' }: BrandedHeaderProps) {
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Get current URL on client side
    setCurrentUrl(window.location.origin);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* QR Code Sidebar - Hidden on mobile */}
      <div className="hidden lg:block absolute left-8 top-8">
        <div className="bg-white p-4 rounded-lg shadow-lg">
          {currentUrl && (
            <QRCodeSVG
              value={currentUrl}
              size={180}
              level="H"
              includeMargin={true}
            />
          )}
          <p className="text-center text-white font-bold text-lg mt-2 bg-navy-blue px-4 py-2 rounded">
            Try it<br />Yourself!
          </p>
        </div>
      </div>

      {/* Main Header Content */}
      <div className="text-center pt-8 pb-6">
        {/* Toronto Police Badge - Using placeholder */}
        <div className="flex justify-center mb-6">
          <div className="w-32 h-32 relative">
            {/* Placeholder badge - Replace with actual Toronto Police badge */}
            <div className="w-full h-full rounded-full bg-gradient-to-br from-yellow-500 via-yellow-400 to-yellow-600 flex items-center justify-center border-4 border-white shadow-2xl">
              <div className="text-center">
                <div className="text-navy-blue font-bold text-xs mb-1">TORONTO</div>
                <div className="text-4xl mb-1">🛡️</div>
                <div className="text-navy-blue font-bold text-xs">POLICE</div>
              </div>
            </div>
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          SixSafety - Your Neighbourhood Safety Advisor
        </h1>

        {/* Welcome Text */}
        <p className="text-xl md:text-2xl text-white max-w-4xl mx-auto px-4">
          Welcome! Please let us know what area of your neighbourhood safety you'd like to learn more about.
        </p>
      </div>
    </div>
  );
}
