/**
 * AIConfiguration Component
 * Tune AI sensitivity, alert thresholds, and model behavior
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';

export default function AIConfiguration() {
  const [riskThreshold, setRiskThreshold] = useState(70);
  const [burnoutSensitivity, setBurnoutSensitivity] = useState(75);
  const [crisisDetection, setCrisisDetection] = useState(90);
  const [priorityAlgorithm, setPriorityAlgorithm] = useState('balanced');

  return (
    <div className="space-y-6">
      {/* Alert Thresholds */}
      <DashboardSection title="Alert Thresholds">
        <div className="space-y-6">
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                Risk Alert Threshold
              </label>
              <span className="text-sm font-semibold text-white">{riskThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={riskThreshold}
              onChange={(e) => setRiskThreshold(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">
              Trigger alerts when ML model predicts risk probability above this threshold
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                Burnout Detection Sensitivity
              </label>
              <span className="text-sm font-semibold text-white">{burnoutSensitivity}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              value={burnoutSensitivity}
              onChange={(e) => setBurnoutSensitivity(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">
              Higher = more sensitive (earlier warnings, more false positives). Lower = less sensitive.
            </p>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-sm font-medium text-slate-300">
                Crisis Language Detection
              </label>
              <span className="text-sm font-semibold text-white">{crisisDetection}%</span>
            </div>
            <input
              type="range"
              min="70"
              max="99"
              value={crisisDetection}
              onChange={(e) => setCrisisDetection(Number(e.target.value))}
              className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer"
            />
            <p className="text-xs text-slate-400 mt-2">
              High threshold recommended for crisis detection to minimize false alarms
            </p>
          </div>
        </div>
      </DashboardSection>

      {/* Priority Algorithm */}
      <DashboardSection title="Priority Algorithm">
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Choose how AI prioritizes athletes in Command Center
          </p>
          <div className="space-y-3">
            {[
              {
                id: 'balanced',
                label: 'Balanced (Recommended)',
                description: 'Equal weight to readiness decline, risk factors, and engagement',
              },
              {
                id: 'risk-focused',
                label: 'Risk-Focused',
                description: 'Prioritize athletes with highest predicted risk scores',
              },
              {
                id: 'readiness-focused',
                label: 'Readiness-Focused',
                description: 'Prioritize based on readiness trends and recent declines',
              },
              {
                id: 'engagement-focused',
                label: 'Engagement-Focused',
                description: 'Prioritize athletes with low engagement or disengagement patterns',
              },
            ].map(option => (
              <label
                key={option.id}
                className={`flex items-start p-4 rounded-lg border cursor-pointer transition-all ${
                  priorityAlgorithm === option.id
                    ? 'bg-blue-900/30 border-blue-600'
                    : 'bg-slate-800/50 border-slate-700 hover:bg-slate-800'
                }`}
              >
                <input
                  type="radio"
                  name="priority"
                  value={option.id}
                  checked={priorityAlgorithm === option.id}
                  onChange={(e) => setPriorityAlgorithm(e.target.value)}
                  className="mt-1 mr-3"
                />
                <div>
                  <h4 className="text-sm font-semibold text-white mb-1">{option.label}</h4>
                  <p className="text-xs text-slate-400">{option.description}</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </DashboardSection>

      {/* Pattern Detection */}
      <DashboardSection title="Pattern Detection">
        <div className="space-y-4">
          {[
            { label: 'Anomaly Detection', enabled: true, description: 'Detect unusual data points' },
            { label: 'Correlation Analysis', enabled: true, description: 'Find relationships between variables' },
            { label: 'Trend Detection', enabled: true, description: 'Identify emerging patterns' },
            { label: 'Cluster Analysis', enabled: false, description: 'Group similar athletes' },
          ].map((feature, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-800/50 border border-slate-700 rounded-lg"
            >
              <div>
                <h5 className="text-sm font-semibold text-white">{feature.label}</h5>
                <p className="text-xs text-slate-400">{feature.description}</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" defaultChecked={feature.enabled} className="sr-only peer" />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-card after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Save Button */}
      <div className="flex justify-end">
        <button className="px-6 py-2 bg-secondary hover:bg-secondary text-white font-medium rounded-md transition-colors">
          Save Configuration
        </button>
      </div>
    </div>
  );
}
