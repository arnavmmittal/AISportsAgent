'use client';

import { useState } from 'react';

interface ActionPlanWidgetProps {
  plan: {
    today: string[];
    this_week: string[];
    next_competition: string[];
  };
  onCheckItem?: (timeframe: string, index: number, checked: boolean) => void;
}

export function ActionPlanWidget({ plan, onCheckItem }: ActionPlanWidgetProps) {
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCheck = (timeframe: string, index: number) => {
    const key = `${timeframe}_${index}`;
    const newChecked = !checkedItems[key];
    setCheckedItems({ ...checkedItems, [key]: newChecked });
    onCheckItem?.(timeframe, index, newChecked);
  };

  if (!plan.today.length && !plan.this_week.length && !plan.next_competition.length) {
    return null;
  }

  const totalItems = plan.today.length + plan.this_week.length + plan.next_competition.length;
  const completedItems = Object.values(checkedItems).filter(Boolean).length;

  return (
    <div className="widget-card animate-fade-in">
      {/* Header */}
      <div className="widget-header">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-accent/10 rounded-lg flex items-center justify-center">
            <svg className="w-5 h-5 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <div>
            <h3 className="widget-title">Action Plan</h3>
            <p className="text-xs text-muted-foreground">{completedItems}/{totalItems} completed</p>
          </div>
        </div>
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="w-8 h-8 rounded-md bg-muted text-muted-foreground hover:bg-muted/80 flex items-center justify-center transition-colors"
          aria-label={isCollapsed ? 'Expand' : 'Collapse'}
        >
          <svg
            className={`w-4 h-4 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>

      {/* Content */}
      {!isCollapsed && (
        <div className="space-y-4">
          {plan.today.length > 0 && (
            <TimeframeSection
              title="Today"
              items={plan.today}
              onCheck={(idx) => handleCheck('today', idx)}
              checkedItems={checkedItems}
              timeframeKey="today"
            />
          )}

          {plan.this_week.length > 0 && (
            <TimeframeSection
              title="This Week"
              items={plan.this_week}
              onCheck={(idx) => handleCheck('this_week', idx)}
              checkedItems={checkedItems}
              timeframeKey="this_week"
            />
          )}

          {plan.next_competition.length > 0 && (
            <TimeframeSection
              title="Next Competition"
              items={plan.next_competition}
              onCheck={(idx) => handleCheck('next_competition', idx)}
              checkedItems={checkedItems}
              timeframeKey="next_competition"
            />
          )}
        </div>
      )}
    </div>
  );
}

interface TimeframeSectionProps {
  title: string;
  items: string[];
  onCheck: (index: number) => void;
  checkedItems: Record<string, boolean>;
  timeframeKey: string;
}

function TimeframeSection({
  title,
  items,
  onCheck,
  checkedItems,
  timeframeKey,
}: TimeframeSectionProps) {
  return (
    <div>
      <h4 className="text-xs font-semibold text-accent uppercase tracking-wide mb-2">
        {title}
      </h4>
      <ul className="space-y-2">
        {items.map((item, idx) => {
          const key = `${timeframeKey}_${idx}`;
          const isChecked = checkedItems[key] || false;
          return (
            <li key={idx} className="flex items-start gap-3 py-1">
              <button
                onClick={() => onCheck(idx)}
                className={`mt-0.5 w-5 h-5 rounded-sm border-2 flex-shrink-0 flex items-center justify-center transition-colors ${
                  isChecked
                    ? 'bg-accent border-accent text-accent-foreground'
                    : 'border-border hover:border-accent/50'
                }`}
                aria-label={isChecked ? 'Uncheck' : 'Check'}
              >
                {isChecked && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <span
                className={`text-sm leading-normal transition-colors ${
                  isChecked ? 'text-muted-foreground line-through' : 'text-foreground'
                }`}
              >
                {item}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
