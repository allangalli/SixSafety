"use client";

import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import {
  loadNeighbourhoodData,
  getNeighbourhoodList,
  getNeighbourhoodStats,
  type NeighbourhoodStats,
  type NeighbourhoodCrime
} from '@/lib/utils/csv-loader';

interface NeighbourhoodSelectorProps {
  onSelect: (stats: NeighbourhoodStats) => void;
  selected: string;
}

/**
 * NeighbourhoodSelector - Styled neighbourhood selection dropdown
 *
 * Features:
 * - Custom-styled dropdown (not plain HTML select)
 * - Shows neighbourhood name with crime count in parentheses
 * - Integrates with existing CSV data loader
 * - "Find Your Neighbourhood" link
 */
export function NeighbourhoodSelector({
  onSelect,
  selected,
}: NeighbourhoodSelectorProps) {
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [allData, setAllData] = useState<NeighbourhoodCrime[]>([]);

  useEffect(() => {
    async function loadData() {
      const data = await loadNeighbourhoodData();
      setAllData(data);
      const list = getNeighbourhoodList(data);
      setNeighbourhoods(list);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSelect = (neighbourhood: string) => {
    const neighbourhoodStats = getNeighbourhoodStats(neighbourhood, allData);
    onSelect(neighbourhoodStats);
  };

  const getCrimeCount = (neighbourhood: string): number => {
    return allData.filter(item => item.neighbourhood === neighbourhood).length;
  };

  if (loading) {
    return (
      <div className="animate-pulse bg-white/20 rounded-lg p-4 text-white text-center">
        Loading neighbourhoods...
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Dropdown Label */}
      <label
        htmlFor="neighbourhood"
        className="block text-white font-semibold text-lg mb-2"
      >
        Choose a Neighbourhood
      </label>

      {/* Custom Styled Select */}
      <div className="relative">
        <select
          id="neighbourhood"
          value={selected}
          onChange={(e) => handleSelect(e.target.value)}
          className="
            w-full px-6 py-4
            bg-navy-blue-light text-white
            border-2 border-white/30
            rounded-lg
            text-lg font-medium
            appearance-none
            cursor-pointer
            focus:outline-none focus:ring-2 focus:ring-brand-orange focus:border-brand-orange
            transition-all duration-200
          "
        >
          <option value="">Select a neighbourhood...</option>
          {neighbourhoods.map((name) => (
            <option key={name} value={name}>
              {name} ({getCrimeCount(name)})
            </option>
          ))}
        </select>

        {/* Chevron Icon */}
        <ChevronDown
          className="absolute right-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white pointer-events-none"
        />
      </div>

      {/* Find Your Neighbourhood Link */}
      <p className="text-sm text-white/80 text-center">
        If you don't know your neighbourhood, you can look it up here:{' '}
        <a
          href="https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/find-your-neighbourhood/#location=&lat=&lng=&zoom="
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-orange hover:text-brand-orange-hover underline font-semibold"
        >
          Find Your Neighbourhood
        </a>
      </p>
    </div>
  );
}
