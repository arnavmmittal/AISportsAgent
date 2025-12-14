/**
 * UserManagement Component
 * Add/remove athletes and coaches, manage roles
 */

'use client';

import { useState } from 'react';
import { DashboardSection } from '../layouts/DashboardGrid';
import StatCard from '../ui/StatCard';

export default function UserManagement() {
  const [showAddModal, setShowAddModal] = useState(false);

  // TODO: Replace with real API data from /api/coach/settings/users
  const users = [
    { id: '1', name: 'Sarah Johnson', role: 'athlete', sport: 'Basketball', year: 'Junior', status: 'active', lastActive: '2025-12-13' },
    { id: '2', name: 'Mike Chen', role: 'athlete', sport: 'Basketball', year: 'Sophomore', status: 'active', lastActive: '2025-12-12' },
    { id: '3', name: 'Jordan Smith', role: 'athlete', sport: 'Soccer', year: 'Senior', status: 'active', lastActive: '2025-12-13' },
    { id: '4', name: 'Alex Martinez', role: 'athlete', sport: 'Soccer', year: 'Freshman', status: 'active', lastActive: '2025-12-10' },
    { id: '5', name: 'Coach Anderson', role: 'coach', sport: 'All', year: null, status: 'active', lastActive: '2025-12-13' },
    { id: '6', name: 'Sam Wilson', role: 'athlete', sport: 'Football', year: 'Junior', status: 'inactive', lastActive: '2025-11-15' },
  ];

  const stats = {
    totalUsers: users.length,
    athletes: users.filter(u => u.role === 'athlete').length,
    coaches: users.filter(u => u.role === 'coach').length,
    active: users.filter(u => u.status === 'active').length,
  };

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Users"
          value={stats.totalUsers}
          subtitle="Athletes + Coaches"
          variant="default"
        />
        <StatCard
          title="Athletes"
          value={stats.athletes}
          subtitle="Student-athletes"
          variant="default"
        />
        <StatCard
          title="Coaches"
          value={stats.coaches}
          subtitle="Coaching staff"
          variant="default"
        />
        <StatCard
          title="Active This Week"
          value={stats.active}
          subtitle={`${Math.round((stats.active / stats.totalUsers) * 100)}% engagement`}
          variant="success"
        />
      </div>

      {/* Add User Button */}
      <div className="flex justify-end">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md transition-colors"
        >
          + Add User
        </button>
      </div>

      {/* Users List */}
      <DashboardSection title="All Users">
        <div className="space-y-2">
          {users.map(user => (
            <div
              key={user.id}
              className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg flex items-center justify-between hover:bg-slate-800/70 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-sm font-semibold text-white">{user.name}</h4>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      user.role === 'coach'
                        ? 'bg-purple-900/30 text-purple-400'
                        : 'bg-blue-900/30 text-blue-400'
                    }`}>
                      {user.role.toUpperCase()}
                    </span>
                    <span className={`text-xs font-medium px-2 py-1 rounded ${
                      user.status === 'active'
                        ? 'bg-green-900/30 text-green-400'
                        : 'bg-slate-700 text-slate-400'
                    }`}>
                      {user.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>{user.sport}</span>
                    {user.year && <><span>•</span><span>{user.year}</span></>}
                    <span>•</span>
                    <span>Last active: {new Date(user.lastActive).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs bg-slate-700 hover:bg-slate-600 text-white rounded transition-colors">
                  Edit
                </button>
                <button className="px-3 py-1 text-xs bg-red-900/30 hover:bg-red-900/50 text-red-400 rounded transition-colors">
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      </DashboardSection>

      {/* Bulk Actions */}
      <DashboardSection title="Bulk Actions">
        <div className="space-y-3">
          <button className="w-full p-3 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 rounded-lg text-left transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Import Athletes from CSV</h4>
                <p className="text-xs text-slate-400">Upload roster file to add multiple athletes at once</p>
              </div>
              <span className="text-blue-400">→</span>
            </div>
          </button>

          <button className="w-full p-3 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 rounded-lg text-left transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Send Consent Requests to All</h4>
                <p className="text-xs text-slate-400">Request data access consent from all athletes without it</p>
              </div>
              <span className="text-blue-400">→</span>
            </div>
          </button>

          <button className="w-full p-3 bg-slate-800/50 border border-slate-700 hover:bg-slate-800 rounded-lg text-left transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-sm font-semibold text-white mb-1">Archive Graduated Athletes</h4>
                <p className="text-xs text-slate-400">Move graduated seniors to archive (retains data per policy)</p>
              </div>
              <span className="text-blue-400">→</span>
            </div>
          </button>
        </div>
      </DashboardSection>

      {/* Add User Modal (simplified placeholder) */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-lg p-6 max-w-md w-full border border-slate-700">
            <h3 className="text-xl font-bold text-white mb-4">Add New User</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Full Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="Enter name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Email</label>
                <input
                  type="email"
                  className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="user@university.edu"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">Role</label>
                <select className="w-full px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-blue-500">
                  <option value="athlete">Athlete</option>
                  <option value="coach">Coach</option>
                </select>
              </div>
              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
                  Add User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
