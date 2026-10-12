/**
 * Toast Notification Component
 * Provides user feedback for actions like copy, share, errors
 */

"use client";

import { useEffect } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

interface ToastProps {
  message: string;
  type?: ToastType;
  duration?: number;
  onClose: () => void;
}

export function Toast({
  message,
  type = "info",
  duration = 3000,
  onClose,
}: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const styles = {
    success: {
      bg: "bg-green-50 border-green-200",
      icon: "text-green-600",
      text: "text-green-900",
      iconPath: "M5 13l4 4L19 7",
    },
    error: {
      bg: "bg-red-50 border-red-200",
      icon: "text-red-600",
      text: "text-red-900",
      iconPath: "M6 18L18 6M6 6l12 12",
    },
    warning: {
      bg: "bg-yellow-50 border-yellow-200",
      icon: "text-yellow-600",
      text: "text-yellow-900",
      iconPath: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z",
    },
    info: {
      bg: "bg-blue-50 border-blue-200",
      icon: "text-blue-600",
      text: "text-blue-900",
      iconPath: "M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z",
    },
  };

  const style = styles[type];

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-sm animate-slide-up ${style.bg} border rounded-lg shadow-lg p-4 flex items-start gap-3`}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <div className="flex-shrink-0">
        <svg
          className={`w-5 h-5 ${style.icon}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={style.iconPath}
          />
        </svg>
      </div>

      {/* Message */}
      <div className="flex-1">
        <p className={`text-sm font-medium ${style.text}`}>{message}</p>
      </div>

      {/* Close button */}
      <button
        onClick={onClose}
        className={`flex-shrink-0 ${style.icon} hover:opacity-70 transition-opacity`}
        aria-label="Close notification"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
    </div>
  );
}

/**
 * Toast Container Hook
 * Manages multiple toasts
 */
export interface ToastData {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

export function ToastContainer({ toasts, onRemove }: {
  toasts: ToastData[];
  onRemove: (id: string) => void;
}) {
  return (
    <div className="fixed bottom-6 right-6 z-50 space-y-3 pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <Toast
            message={toast.message}
            type={toast.type}
            duration={toast.duration}
            onClose={() => onRemove(toast.id)}
          />
        </div>
      ))}
    </div>
  );
}
