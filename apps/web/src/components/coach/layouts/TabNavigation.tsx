/**
 * TabNavigation Component
 * Sub-page tabs for multi-section pages like Analytics Hub
 */

'use client';

import { cn } from '@/lib/utils';
import { ReactNode, useState } from 'react';

export interface Tab {
  id: string;
  label: string;
  icon?: string;
  badge?: number;
  content: ReactNode;
}

interface TabNavigationProps {
  tabs: Tab[];
  defaultTab?: string;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
  onTabChange?: (tabId: string) => void;
}

export default function TabNavigation({
  tabs,
  defaultTab,
  variant = 'default',
  className,
  onTabChange,
}: TabNavigationProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn('space-y-6', className)}>
      {/* Tab Bar */}
      <div className={cn('border-b border-slate-700', variant === 'pills' && 'border-0')}>
        <nav className={cn('flex gap-2', variant === 'pills' && 'gap-1')}>
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab.id)}
                className={cn(
                  'relative px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2',
                  // Default variant
                  variant === 'default' &&
                    (isActive
                      ? 'text-white border-b-2 border-blue-500'
                      : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:border-slate-600'),
                  // Pills variant
                  variant === 'pills' &&
                    (isActive
                      ? 'bg-blue-600 text-white rounded-lg'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg'),
                  // Underline variant
                  variant === 'underline' &&
                    (isActive
                      ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                      : 'text-slate-400 hover:text-slate-200')
                )}
              >
                {tab.icon && <span className="text-lg">{tab.icon}</span>}
                <span>{tab.label}</span>
                {tab.badge !== undefined && (
                  <span
                    className={cn(
                      'px-2 py-0.5 text-xs font-bold rounded-full',
                      isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                    )}
                  >
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="tab-content">{activeTabContent}</div>
    </div>
  );
}

// Controlled tabs (external state management)
export function ControlledTabs({
  tabs,
  activeTab,
  onTabChange,
  variant = 'default',
  className,
}: {
  tabs: Omit<Tab, 'content'>[];
  activeTab: string;
  onTabChange: (tabId: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  className?: string;
}) {
  return (
    <div className={cn('border-b border-slate-700', variant === 'pills' && 'border-0', className)}>
      <nav className={cn('flex gap-2', variant === 'pills' && 'gap-1')}>
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={cn(
                'relative px-4 py-3 text-sm font-medium transition-all duration-200 flex items-center gap-2',
                variant === 'default' &&
                  (isActive
                    ? 'text-white border-b-2 border-blue-500'
                    : 'text-slate-400 hover:text-slate-200 border-b-2 border-transparent hover:border-slate-600'),
                variant === 'pills' &&
                  (isActive
                    ? 'bg-blue-600 text-white rounded-lg'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg'),
                variant === 'underline' &&
                  (isActive
                    ? 'text-white after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-500'
                    : 'text-slate-400 hover:text-slate-200')
              )}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span>{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full',
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// Vertical tabs (sidebar-style)
export function VerticalTabs({
  tabs,
  defaultTab,
  className,
  onTabChange,
}: {
  tabs: Tab[];
  defaultTab?: string;
  className?: string;
  onTabChange?: (tabId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const handleTabClick = (tabId: string) => {
    setActiveTab(tabId);
    onTabChange?.(tabId);
  };

  const activeTabContent = tabs.find((tab) => tab.id === activeTab)?.content;

  return (
    <div className={cn('flex gap-6', className)}>
      {/* Sidebar tabs */}
      <nav className="w-48 space-y-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => handleTabClick(tab.id)}
              className={cn(
                'w-full px-4 py-3 text-left text-sm font-medium transition-all duration-200 flex items-center gap-3 rounded-lg',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              )}
            >
              {tab.icon && <span className="text-lg">{tab.icon}</span>}
              <span className="flex-1">{tab.label}</span>
              {tab.badge !== undefined && (
                <span
                  className={cn(
                    'px-2 py-0.5 text-xs font-bold rounded-full',
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  )}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Content area */}
      <div className="flex-1">{activeTabContent}</div>
    </div>
  );
}

// Segmented control (iOS-style)
export function SegmentedControl({
  options,
  value,
  onChange,
  className,
}: {
  options: Array<{ value: string; label: string; icon?: string }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'inline-flex bg-slate-800 rounded-lg p-1 gap-1',
        className
      )}
    >
      {options.map((option) => {
        const isActive = value === option.value;

        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-all duration-200 rounded-md flex items-center gap-2',
              isActive
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            )}
          >
            {option.icon && <span>{option.icon}</span>}
            <span>{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}
