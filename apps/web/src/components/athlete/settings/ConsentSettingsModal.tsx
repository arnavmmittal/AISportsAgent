'use client';

/**
 * Athlete Consent Settings Modal
 *
 * Allows athletes to control consent for weekly chat summaries
 * - Explains what coaches will/won't see
 * - Provides toggle for enabling/disabling
 * - Shows confirmation when toggling
 */

import { useState } from 'react';

interface ConsentSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConsent: boolean;
  onConsentChange: (newConsent: boolean) => Promise<void>;
}

export default function ConsentSettingsModal({
  isOpen,
  onClose,
  currentConsent,
  onConsentChange,
}: ConsentSettingsModalProps) {
  const [consent, setConsent] = useState(currentConsent);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);

  if (!isOpen) return null;

  const handleToggle = async (newConsent: boolean) => {
    setShowConfirmation(true);
    setConsent(newConsent);
  };

  const confirmChange = async () => {
    try {
      setSaving(true);
      setError(null);

      await onConsentChange(consent);

      setShowConfirmation(false);
      setTimeout(() => {
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Error updating consent:', err);
      setError(err.message || 'Failed to update consent');
      setConsent(currentConsent); // Revert on error
    } finally {
      setSaving(false);
    }
  };

  const cancelChange = () => {
    setConsent(currentConsent);
    setShowConfirmation(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900">Weekly Chat Summary Privacy Settings</h2>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* What This Does */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-2">What are Weekly Chat Summaries?</h3>
            <p className="text-sm text-gray-600">
              Every week, we create a summary of your conversations with the AI coach. This summary helps your coaching staff understand how you're doing and provide better support.
            </p>
          </div>

          {/* What Coaches See */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What Coaches WILL See:
            </h3>
            <ul className="space-y-1 text-sm text-green-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Average mood and confidence scores (e.g., 7/10)</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Key themes discussed (e.g., "pre-game anxiety", "time management")</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Suggested techniques practiced</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Overall engagement level (number of sessions)</span>
              </li>
            </ul>
          </div>

          {/* What Coaches Don't See */}
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-red-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              What Coaches will NOT See:
            </h3>
            <ul className="space-y-1 text-sm text-red-800">
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Your actual chat messages</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Personal details shared in conversations</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Specific examples or stories you've mentioned</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">•</span>
                <span>Any crisis alerts or sensitive topics (handled separately)</span>
              </li>
            </ul>
          </div>

          {/* Data Retention */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Data Retention:
            </h3>
            <p className="text-sm text-blue-800">
              Summaries are kept for 12 weeks and can be revoked at any time. If you turn off consent, all existing summaries are immediately deleted.
            </p>
          </div>

          {/* Toggle */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Enable Weekly Chat Summaries</h3>
                <p className="text-xs text-gray-600 mt-1">
                  Allow coaches to see weekly summaries of your conversations
                </p>
              </div>
              <button
                onClick={() => handleToggle(!consent)}
                disabled={saving}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  consent ? 'bg-blue-600' : 'bg-gray-200'
                } ${saving ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-card transition-transform ${
                    consent ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-3 text-sm text-red-700">
              {error}
            </div>
          )}

          {/* Confirmation */}
          {showConfirmation && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h4 className="text-sm font-semibold text-yellow-900 mb-2">Confirm Your Choice</h4>
              <p className="text-sm text-yellow-800 mb-4">
                {consent ? (
                  <>You are about to enable weekly chat summaries. Your coaches will be able to see high-level summaries of your conversations.</>
                ) : (
                  <>You are about to disable weekly chat summaries. All existing summaries will be immediately deleted and coaches will no longer receive new summaries.</>
                )}
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={confirmChange}
                  disabled={saving}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {saving ? 'Saving...' : 'Confirm'}
                </button>
                <button
                  onClick={cancelChange}
                  disabled={saving}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors text-sm font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 p-6 bg-gray-50">
          <p className="text-xs text-gray-600">
            Your privacy is important to us. You can change this setting at any time from your dashboard privacy settings.
          </p>
        </div>
      </div>
    </div>
  );
}
