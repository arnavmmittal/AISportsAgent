/**
 * TeamSettings Component
 * Configure team information, sports, and seasons
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';

export default function TeamSettings() {
  const [teamName, setTeamName] = useState('University Athletics');
  const [institution, setInstitution] = useState('University of Washington');
  const [season, setSeason] = useState('2025-2026');

  // TODO: Replace with real API calls to /api/coach/settings/team
  const handleSave = () => {
    console.log('Saving team settings...', { teamName, institution, season });
    // API call here
  };

  return (
    <div className="space-y-6">
      {/* Basic Team Info */}
      <DashboardSection title="Basic Information">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Team Name
            </label>
            <input
              type="text"
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter team name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Institution
            </label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              placeholder="Enter institution name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Current Season
            </label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
            >
              <option value="2024-2025">2024-2025</option>
              <option value="2025-2026">2025-2026</option>
              <option value="2026-2027">2026-2027</option>
            </select>
          </div>
        </div>
      </DashboardSection>

      {/* Sports Configuration */}
      <DashboardSection title="Sports & Teams">
        <div className="space-y-3">
          {[
            { sport: 'Basketball', athletes: 12, status: 'active' },
            { sport: 'Soccer', athletes: 8, status: 'active' },
            { sport: 'Football', athletes: 5, status: 'active' },
            { sport: 'Volleyball', athletes: 0, status: 'inactive' },
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-between"
            >
              <div>
                <h4 className="text-sm font-semibold text-white">{item.sport}</h4>
                <p className="text-xs text-slate-400">
                  {item.athletes} athlete{item.athletes !== 1 ? 's' : ''}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-3 py-1 rounded ${
                  item.status === 'active'
                    ? 'bg-green-900/30 text-green-400'
                    : 'bg-slate-700 text-slate-400'
                }`}
              >
                {item.status}
              </span>
            </div>
          ))}
        </div>
        <button className="mt-4 px-4 py-2 bg-primary hover:opacity-90 text-white text-sm rounded-md transition-colors">
          Add Sport
        </button>
      </DashboardSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md transition-colors"
        >
          Save Changes
        </button>
      </div>
    </div>
  );
}
