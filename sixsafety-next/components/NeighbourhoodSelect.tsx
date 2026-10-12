"use client";

import { useState, useEffect } from 'react';
import {
  loadNeighbourhoodData,
  getNeighbourhoodList,
  getNeighbourhoodStats,
  type NeighbourhoodStats
} from '@/lib/utils/csv-loader';

interface NeighbourhoodSelectProps {
  onSelect: (stats: NeighbourhoodStats) => void;
}

export function NeighbourhoodSelect({ onSelect }: NeighbourhoodSelectProps) {
  const [neighbourhoods, setNeighbourhoods] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>('');
  const [stats, setStats] = useState<NeighbourhoodStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      const data = await loadNeighbourhoodData();
      const list = getNeighbourhoodList(data);
      setNeighbourhoods(list);
      setLoading(false);
    }
    loadData();
  }, []);

  const handleSelect = async (neighbourhood: string) => {
    setSelected(neighbourhood);
    const data = await loadNeighbourhoodData();
    const neighbourhoodStats = getNeighbourhoodStats(neighbourhood, data);
    setStats(neighbourhoodStats);
    onSelect(neighbourhoodStats);
  };

  if (loading) {
    return <div className="animate-pulse">Loading neighbourhoods...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <label htmlFor="neighbourhood" className="block text-sm font-medium mb-2">
          Choose Your Neighbourhood
        </label>
        <select
          id="neighbourhood"
          value={selected}
          onChange={(e) => handleSelect(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="">Select a neighbourhood...</option>
          {neighbourhoods.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {stats && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-lg mb-3">{stats.neighbourhood}</h3>
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">Safety Risk Levels:</p>
            {stats.crimes.map((crime, idx) => (
              <div key={idx} className="flex justify-between items-center">
                <span className="text-sm">{crime.type}:</span>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    crime.risk === 'High'
                      ? 'bg-red-100 text-red-800'
                      : crime.risk === 'Medium'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-green-100 text-green-800'
                  }`}
                >
                  {crime.risk}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-gray-600">
        If you don't know your neighbourhood,{' '}
        <a
          href="https://www.toronto.ca/city-government/data-research-maps/neighbourhoods-communities/neighbourhood-profiles/find-your-neighbourhood/#location=&lat=&lng=&zoom="
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          look it up here
        </a>
      </p>
    </div>
  );
}
