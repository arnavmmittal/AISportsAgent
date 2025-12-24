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

  const handleCheck = (timeframe: string, index: number) => {
    const key = `${timeframe}_${index}`;
    const newChecked = !checkedItems[key];
    setCheckedItems({ ...checkedItems, [key]: newChecked });
    onCheckItem?.(timeframe, index, newChecked);
  };

  if (!plan.today.length && !plan.this_week.length && !plan.next_competition.length) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mt-6 shadow-lg border-2 border-purple-200 animate-in fade-in slide-in-from-bottom-3 duration-500">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-blue-600 rounded-full flex items-center justify-center shadow-md">
          <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h3 className="font-black text-2xl bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
          Your Action Plan 🎯
        </h3>
      </div>

      <div className="space-y-6">
        {plan.today.length > 0 && (
          <TimeframeSection
            title="TODAY"
            items={plan.today}
            icon="🎯"
            iconColor="from-red-500 to-pink-600"
            onCheck={(idx) => handleCheck('today', idx)}
            checkedItems={checkedItems}
            timeframeKey="today"
          />
        )}

        {plan.this_week.length > 0 && (
          <TimeframeSection
            title="THIS WEEK"
            items={plan.this_week}
            icon="📅"
            iconColor="from-blue-500 to-indigo-600"
            onCheck={(idx) => handleCheck('this_week', idx)}
            checkedItems={checkedItems}
            timeframeKey="this_week"
          />
        )}

        {plan.next_competition.length > 0 && (
          <TimeframeSection
            title="NEXT COMPETITION"
            items={plan.next_competition}
            icon="🏆"
            iconColor="from-amber-500 to-orange-600"
            onCheck={(idx) => handleCheck('next_competition', idx)}
            checkedItems={checkedItems}
            timeframeKey="next_competition"
          />
        )}
      </div>
    </div>
  );
}

interface TimeframeSectionProps {
  title: string;
  items: string[];
  icon: string;
  iconColor: string;
  onCheck: (index: number) => void;
  checkedItems: Record<string, boolean>;
  timeframeKey: string;
}

function TimeframeSection({
  title,
  items,
  icon,
  iconColor,
  onCheck,
  checkedItems,
  timeframeKey,
}: TimeframeSectionProps) {
  return (
    <div className="bg-card rounded-xl p-5 shadow-md border border-gray-200">
      <div className="flex items-center gap-3 mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${iconColor} rounded-lg flex items-center justify-center text-xl shadow-sm`}>
          {icon}
        </div>
        <h4 className="font-bold text-lg text-gray-800">
          {title}
        </h4>
      </div>
      <ul className="space-y-3">
        {items.map((item, idx) => {
          const key = `${timeframeKey}_${idx}`;
          const isChecked = checkedItems[key] || false;
          return (
            <li key={idx} className="flex items-start gap-3 group">
              <input
                type="checkbox"
                checked={isChecked}
                onChange={() => onCheck(idx)}
                className="mt-1 w-5 h-5 text-purple-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-purple-500 cursor-pointer transition-all"
                id={`action-${key}`}
              />
              <label
                htmlFor={`action-${key}`}
                className={`text-base leading-relaxed cursor-pointer transition-all ${
                  isChecked ? 'text-muted-foreground line-through' : 'text-gray-700 group-hover:text-purple-700'
                }`}
              >
                {item}
              </label>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
