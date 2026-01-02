'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';

interface SportFilterProps {
  selectedSports: string[];
  onSportsChange: (sports: string[]) => void;
  className?: string;
}

const ALL_SPORTS = [
  'Basketball',
  'Football',
  'Soccer',
  'Baseball',
  'Volleyball',
  'Track & Field',
  'Swimming',
  'Tennis',
  'Cross Country',
  'Wrestling',
  'Gymnastics',
  'Lacrosse',
];

export function SportFilter({ selectedSports, onSportsChange, className = '' }: SportFilterProps) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSport = (sport: string) => {
    if (selectedSports.includes(sport)) {
      onSportsChange(selectedSports.filter((s) => s !== sport));
    } else {
      onSportsChange([...selectedSports, sport]);
    }
  };

  const selectAll = () => {
    onSportsChange(ALL_SPORTS);
  };

  const clearAll = () => {
    onSportsChange([]);
  };

  const displayText =
    selectedSports.length === 0
      ? 'All Sports'
      : selectedSports.length === ALL_SPORTS.length
      ? 'All Sports'
      : selectedSports.length === 1
      ? selectedSports[0]
      : `${selectedSports.length} Sports Selected`;

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-xl hover:border-blue-500 dark:hover:border-blue-400 transition-all font-bold text-gray-800 dark:text-gray-200"
      >
        <span>🏆</span>
        <span>{displayText}</span>
        <svg
          className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <div className="absolute top-full mt-2 right-0 w-72 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 rounded-xl shadow-2xl z-20 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-900">
              <span className="font-black text-gray-800 dark:text-gray-200">Filter by Sport</span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-bold"
                >
                  All
                </button>
                <button
                  onClick={clearAll}
                  className="text-xs px-3 py-1 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-bold"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Sport List */}
            <div className="max-h-96 overflow-y-auto">
              {ALL_SPORTS.map((sport) => {
                const isSelected = selectedSports.includes(sport);
                return (
                  <button
                    key={sport}
                    onClick={() => toggleSport(sport)}
                    className={`w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${
                      isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                    }`}
                  >
                    <span className={`font-semibold ${isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      {sport}
                    </span>
                    {isSelected && <Check className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <div className="text-xs text-gray-600 dark:text-gray-400 font-semibold text-center">
                {selectedSports.length} of {ALL_SPORTS.length} sports selected
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
