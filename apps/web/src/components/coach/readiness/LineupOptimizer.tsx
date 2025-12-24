/**
 * LineupOptimizer Component
 * Game-day lineup recommendations based on readiness scores
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

export default function LineupOptimizer() {
  const [selectedGame, setSelectedGame] = useState('next');

  // TODO: Replace with real game schedule from /api/coach/schedule
  const upcomingGames = [
    {
      id: 'next',
      opponent: 'State University',
      date: '2025-12-15',
      time: '7:00 PM',
      venue: 'Home',
      importance: 'Championship',
    },
    {
      id: 'game2',
      opponent: 'City College',
      date: '2025-12-18',
      time: '6:30 PM',
      venue: 'Away',
      importance: 'Regular Season',
    },
    {
      id: 'game3',
      opponent: 'Tech Institute',
      date: '2025-12-22',
      time: '5:00 PM',
      venue: 'Home',
      importance: 'Regular Season',
    },
  ];

  // TODO: Replace with ML-optimized lineup from /api/coach/lineup/optimize
  const lineupRecommendations = {
    starting: [
      {
        name: 'Sarah Johnson',
        position: 'Point Guard',
        readiness: 95,
        confidence: 92,
        reason: 'Peak readiness, excellent recent performance',
        riskLevel: 'LOW',
      },
      {
        name: 'Jordan Smith',
        position: 'Shooting Guard',
        readiness: 94,
        confidence: 90,
        reason: 'Improving trend, high confidence levels',
        riskLevel: 'LOW',
      },
      {
        name: 'Taylor Brown',
        position: 'Small Forward',
        readiness: 89,
        confidence: 88,
        reason: 'Solid readiness, consistent performer',
        riskLevel: 'LOW',
      },
      {
        name: 'Chris Lee',
        position: 'Power Forward',
        readiness: 82,
        confidence: 85,
        reason: 'Good readiness, recovered from minor fatigue',
        riskLevel: 'MODERATE',
      },
      {
        name: 'Jamie Davis',
        position: 'Center',
        readiness: 78,
        confidence: 80,
        reason: 'Acceptable readiness, monitor during game',
        riskLevel: 'MODERATE',
      },
    ],
    bench: [
      {
        name: 'Alex Martinez',
        position: 'Guard',
        readiness: 69,
        reason: 'Low readiness - recommend limited minutes',
        riskLevel: 'HIGH',
      },
      {
        name: 'Mike Chen',
        position: 'Forward',
        readiness: 63,
        reason: 'Declining readiness - consider rest',
        riskLevel: 'HIGH',
      },
    ],
    injured: [
      {
        name: 'Sam Wilson',
        position: 'Guard',
        status: 'Recovering',
        expectedReturn: '2025-12-20',
      },
    ],
  };

  const selectedGameInfo = upcomingGames.find((g) => g.id === selectedGame);

  return (
    <div className="space-y-6">
      {/* Game Selector */}
      <div className="flex gap-3 overflow-x-auto pb-2">
        {upcomingGames.map((game) => (
          <button
            key={game.id}
            onClick={() => setSelectedGame(game.id)}
            className={`flex-shrink-0 px-4 py-3 rounded-lg border transition-all ${
              selectedGame === game.id
                ? 'bg-primary border-blue-500 text-white'
                : 'bg-slate-800/50 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
          >
            <div className="text-sm font-semibold">{game.opponent}</div>
            <div className="text-xs opacity-80">{game.date}</div>
            {game.importance === 'Championship' && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded mt-1 inline-block">
                🏆 Championship
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lineup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Starting Lineup Avg"
          value={87.6}
          subtitle="Readiness score"
          variant="success"
        />
        <StatCard
          title="Injury Risk"
          value="Low"
          subtitle="Based on readiness"
          variant="success"
        />
        <StatCard
          title="Optimal Substitutions"
          value={3}
          subtitle="Recommended"
          variant="default"
        />
        <StatCard
          title="Bench Depth"
          value="Moderate"
          subtitle="2 players at risk"
          variant="warning"
        />
      </div>

      {/* Recommended Starting Lineup */}
      <DashboardSection
        title={`Recommended Starting Lineup - ${selectedGameInfo?.opponent}`}
        description="AI-optimized based on readiness, performance, and matchup"
      >
        <div className="space-y-3">
          {lineupRecommendations.starting.map((player, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-white">
                        {player.name}
                      </h4>
                      <p className="text-xs text-slate-400">{player.position}</p>
                    </div>
                  </div>
                  <p className="text-sm text-slate-300 ml-11">{player.reason}</p>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-green-400 mb-1">
                    {player.readiness}
                  </div>
                  <div className="text-xs text-slate-400">
                    {player.confidence}% confidence
                  </div>
                  <span
                    className={`inline-block mt-2 text-xs font-medium px-2 py-1 rounded ${
                      player.riskLevel === 'LOW'
                        ? 'bg-green-900/30 text-green-400'
                        : player.riskLevel === 'MODERATE'
                        ? 'bg-yellow-900/30 text-yellow-400'
                        : 'bg-red-900/30 text-red-400'
                    }`}
                  >
                    {player.riskLevel} Risk
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Bench Players */}
      <DashboardSection title="Bench & Rotation">
        <div className="space-y-3">
          {lineupRecommendations.bench.map((player, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="text-sm font-semibold text-white mb-1">
                    {player.name}
                  </h4>
                  <p className="text-xs text-slate-400 mb-2">{player.position}</p>
                  <p className="text-sm text-slate-300">{player.reason}</p>
                </div>
                <div className="text-right">
                  <div
                    className={`text-2xl font-bold mb-1 ${
                      player.readiness >= 70 ? 'text-yellow-400' : 'text-red-400'
                    }`}
                  >
                    {player.readiness}
                  </div>
                  <span
                    className={`inline-block text-xs font-medium px-2 py-1 rounded ${
                      player.riskLevel === 'HIGH'
                        ? 'bg-red-900/30 text-red-400'
                        : 'bg-yellow-900/30 text-yellow-400'
                    }`}
                  >
                    {player.riskLevel} Risk
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Substitution Strategy */}
      <DashboardSection title="Recommended Substitution Strategy">
        <div className="space-y-3">
          {[
            {
              time: 'Q1 - 5:00',
              action: 'Monitor Jamie Davis closely - sub if showing fatigue',
              priority: 'MONITOR',
            },
            {
              time: 'Q2 - 2:00',
              action: 'Rest Chris Lee for 3-4 minutes to maintain readiness',
              priority: 'RECOMMENDED',
            },
            {
              time: 'Halftime',
              action: 'Reassess readiness levels - check with training staff',
              priority: 'REQUIRED',
            },
            {
              time: 'Q3 - 8:00',
              action: 'Avoid using Alex Martinez unless absolutely necessary',
              priority: 'CAUTION',
            },
          ].map((strategy, index) => (
            <div
              key={index}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-blue-400">
                      {strategy.time}
                    </span>
                    <span
                      className={`text-xs font-medium px-2 py-1 rounded ${
                        strategy.priority === 'REQUIRED'
                          ? 'bg-red-900/30 text-red-400'
                          : strategy.priority === 'CAUTION'
                          ? 'bg-amber-900/30 text-amber-400'
                          : strategy.priority === 'RECOMMENDED'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-slate-700 text-slate-300'
                      }`}
                    >
                      {strategy.priority}
                    </span>
                  </div>
                  <p className="text-sm text-slate-300">{strategy.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Injured/Unavailable */}
      {lineupRecommendations.injured.length > 0 && (
        <DashboardSection title="Injured / Unavailable">
          <div className="space-y-2">
            {lineupRecommendations.injured.map((player, index) => (
              <div
                key={index}
                className="p-3 bg-red-900/10 border border-red-700 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-semibold text-white">
                      {player.name}
                    </h4>
                    <p className="text-xs text-slate-400">{player.position}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-red-400">{player.status}</div>
                    <div className="text-xs text-slate-400">
                      Return: {player.expectedReturn}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </DashboardSection>
      )}
    </div>
  );
}
