/**
 * PrivacyConsent Component
 * Manage athlete consent and data access permissions
 */

'use client';

import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

export default function PrivacyConsent() {
  // TODO: Replace with real API data from /api/coach/settings/privacy
  const consentStats = {
    total: 42,
    granted: 35,
    pending: 5,
    denied: 2,
  };

  const athletes = [
    { name: 'Sarah Johnson', sport: 'Basketball', status: 'granted', date: '2025-11-15' },
    { name: 'Mike Chen', sport: 'Basketball', status: 'granted', date: '2025-11-20' },
    { name: 'Jordan Smith', sport: 'Soccer', status: 'granted', date: '2025-11-18' },
    { name: 'Alex Martinez', sport: 'Soccer', status: 'pending', date: null },
    { name: 'Taylor Brown', sport: 'Basketball', status: 'granted', date: '2025-11-16' },
    { name: 'Chris Lee', sport: 'Football', status: 'denied', date: '2025-11-22' },
  ];

  return (
    <div className="space-y-6">
      {/* Consent Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Athletes"
          value={consentStats.total}
          subtitle="In your roster"
          variant="default"
        />
        <StatCard
          title="Access Granted"
          value={consentStats.granted}
          subtitle={`${Math.round((consentStats.granted / consentStats.total) * 100)}% of roster`}
          variant="success"
        />
        <StatCard
          title="Pending Consent"
          value={consentStats.pending}
          subtitle="Awaiting response"
          variant="warning"
        />
        <StatCard
          title="Access Denied"
          value={consentStats.denied}
          subtitle="Limited visibility"
          variant="danger"
        />
      </div>

      {/* Privacy Policy */}
      <DashboardSection title="Privacy & FERPA Compliance">
        <div className="space-y-4">
          <div className="p-4 bg-blue-900/20 border border-blue-700 rounded-lg">
            <h4 className="text-sm font-semibold text-blue-400 mb-2">
              🔒 FERPA-Compliant Data Handling
            </h4>
            <ul className="space-y-1 text-sm text-slate-300">
              <li>• Athletes must explicitly consent before coaches can view detailed data</li>
              <li>• All data encrypted at rest and in transit</li>
              <li>• Access logs maintained for audit compliance</li>
              <li>• Athletes can revoke consent at any time</li>
            </ul>
          </div>

          <div className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg">
            <h4 className="text-sm font-semibold text-white mb-2">
              What Coaches Can See
            </h4>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="font-semibold text-accent mb-1">With Consent:</p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Readiness scores & trends</li>
                  <li>• Mood & stress logs</li>
                  <li>• Goal progress</li>
                  <li>• Assignment submissions</li>
                  <li>• AI chat summaries</li>
                </ul>
              </div>
              <div>
                <p className="font-semibold text-muted-foreground mb-1">Without Consent:</p>
                <ul className="space-y-1 text-slate-300">
                  <li>• Name & sport only</li>
                  <li>• No wellness data</li>
                  <li>• No chat access</li>
                  <li>• No goals/assignments</li>
                  <li>• Limited to roster view</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </DashboardSection>

      {/* Athlete Consent Status */}
      <DashboardSection title="Athlete Consent Status">
        <div className="space-y-2">
          {athletes.map((athlete, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-lg border flex items-center justify-between ${
                athlete.status === 'granted'
                  ? 'bg-secondary/20/10 border-secondary'
                  : athlete.status === 'pending'
                  ? 'bg-muted-foreground/20/10 border-muted-foreground'
                  : 'bg-muted-foreground/20/10 border-muted-foreground'
              }`}
            >
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">{athlete.name}</h4>
                <p className="text-xs text-slate-400">{athlete.sport}</p>
              </div>
              <div className="text-right">
                <span
                  className={`inline-block text-xs font-medium px-3 py-1 rounded ${
                    athlete.status === 'granted'
                      ? 'bg-secondary/20/50 text-accent'
                      : athlete.status === 'pending'
                      ? 'bg-muted-foreground/20/50 text-chrome'
                      : 'bg-muted-foreground/20/50 text-chrome'
                  }`}
                >
                  {athlete.status === 'granted' && '✓ Access Granted'}
                  {athlete.status === 'pending' && '⏳ Pending'}
                  {athlete.status === 'denied' && '✗ Access Denied'}
                </span>
                {athlete.date && (
                  <p className="text-xs text-slate-400 mt-1">
                    Since {new Date(athlete.date).toLocaleDateString()}
                  </p>
                )}
                {athlete.status === 'pending' && (
                  <button className="mt-2 text-xs text-blue-400 hover:text-blue-300">
                    Send Reminder
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Data Retention */}
      <DashboardSection title="Data Retention Policy">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Data Retention Period
            </label>
            <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
              <option value="1-year">1 Year after graduation</option>
              <option value="2-years">2 Years after graduation</option>
              <option value="5-years">5 Years after graduation</option>
              <option value="indefinite">Indefinite (with consent)</option>
            </select>
            <p className="text-xs text-slate-400 mt-2">
              How long to retain athlete data after they leave the program
            </p>
          </div>

          <div className="flex items-center gap-2">
            <input type="checkbox" id="autoDelete" className="rounded" defaultChecked />
            <label htmlFor="autoDelete" className="text-sm text-slate-300">
              Automatically delete data when retention period expires
            </label>
          </div>
        </div>
      </DashboardSection>
    </div>
  );
}
