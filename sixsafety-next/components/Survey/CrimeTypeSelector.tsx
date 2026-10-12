"use client";

import { useState } from 'react';
import { X, ChevronDown } from 'lucide-react';

interface CrimeTypeSelectorProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
}

/**
 * Multi-select tag interface for crime types
 * Shows selected items as removable orange pills with × button
 */
export function CrimeTypeSelector({
  label,
  options,
  selected,
  onChange,
  disabled = false,
}: CrimeTypeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const available = options.filter(opt => !selected.includes(opt));

  const handleAdd = (option: string) => {
    onChange([...selected, option]);
    setIsOpen(false);
  };

  const handleRemove = (option: string) => {
    onChange(selected.filter(item => item !== option));
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>

      <div className="space-y-2">
        {/* Selected tags */}
        <div className="flex flex-wrap gap-2 min-h-[2.5rem]">
          {selected.map(item => (
            <span
              key={item}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-orange text-white text-sm font-medium rounded-full shadow-sm"
            >
              {item}
              <button
                onClick={() => handleRemove(item)}
                disabled={disabled}
                className="hover:bg-brand-orange-hover rounded-full p-0.5 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Remove ${item}`}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}

          {/* Add button */}
          {available.length > 0 && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                disabled={disabled}
                className="inline-flex items-center gap-1 px-3 py-1.5 border-2 border-brand-orange text-brand-orange text-sm font-medium rounded-full hover:bg-brand-orange hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                + Add crime type
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {/* Dropdown */}
              {isOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setIsOpen(false)}
                  />
                  <div className="absolute left-0 top-full mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20 min-w-[200px] max-h-[300px] overflow-y-auto">
                    {available.map(opt => (
                      <button
                        key={opt}
                        onClick={() => handleAdd(opt)}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {selected.length === 0 && (
          <p className="text-sm text-gray-500 italic">
            No crime types selected yet. Click "Add crime type" to select.
          </p>
        )}
      </div>
    </div>
  );
}
