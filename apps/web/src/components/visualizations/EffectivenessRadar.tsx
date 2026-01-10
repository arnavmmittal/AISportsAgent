/**
 * EffectivenessRadar Component
 *
 * Displays intervention effectiveness across different dimensions
 * Uses a radar/spider chart visualization
 */

'use client';

import { useMemo } from 'react';

interface RadarData {
  label: string;
  value: number; // 0-100 scale
  baseline?: number;
}

interface EffectivenessRadarProps {
  data: RadarData[];
  title?: string;
  showBaseline?: boolean;
}

export function EffectivenessRadar({
  data,
  title = 'Intervention Effectiveness',
  showBaseline = true,
}: EffectivenessRadarProps) {
  const centerX = 150;
  const centerY = 150;
  const maxRadius = 120;

  const points = useMemo(() => {
    const n = data.length;
    return data.map((d, i) => {
      const angle = (i / n) * 2 * Math.PI - Math.PI / 2;
      const radius = (d.value / 100) * maxRadius;
      const baselineRadius = ((d.baseline ?? 50) / 100) * maxRadius;
      return {
        ...d,
        x: centerX + radius * Math.cos(angle),
        y: centerY + radius * Math.sin(angle),
        baselineX: centerX + baselineRadius * Math.cos(angle),
        baselineY: centerY + baselineRadius * Math.sin(angle),
        labelX: centerX + (maxRadius + 20) * Math.cos(angle),
        labelY: centerY + (maxRadius + 20) * Math.sin(angle),
        angle: (i / n) * 360,
      };
    });
  }, [data]);

  const polygonPath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ') + ' Z';
  const baselinePath =
    points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.baselineX} ${p.baselineY}`).join(' ') + ' Z';

  // Grid circles at 25%, 50%, 75%, 100%
  const gridCircles = [25, 50, 75, 100].map((pct) => ({
    radius: (pct / 100) * maxRadius,
    label: `${pct}%`,
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 text-center">
          {title}
        </h3>
      )}

      <svg viewBox="0 0 300 300" className="w-full max-w-sm mx-auto">
        {/* Grid circles */}
        {gridCircles.map((circle, i) => (
          <g key={i}>
            <circle
              cx={centerX}
              cy={centerY}
              r={circle.radius}
              fill="none"
              stroke="#e5e7eb"
              strokeWidth="1"
              className="dark:stroke-gray-700"
            />
            {i === gridCircles.length - 1 && (
              <text
                x={centerX + 5}
                y={centerY - circle.radius + 12}
                className="text-[10px] fill-gray-400"
              >
                {circle.label}
              </text>
            )}
          </g>
        ))}

        {/* Axis lines */}
        {points.map((p, i) => (
          <line
            key={i}
            x1={centerX}
            y1={centerY}
            x2={centerX + maxRadius * Math.cos((i / points.length) * 2 * Math.PI - Math.PI / 2)}
            y2={centerY + maxRadius * Math.sin((i / points.length) * 2 * Math.PI - Math.PI / 2)}
            stroke="#e5e7eb"
            strokeWidth="1"
            className="dark:stroke-gray-700"
          />
        ))}

        {/* Baseline polygon */}
        {showBaseline && (
          <path
            d={baselinePath}
            fill="rgba(156, 163, 175, 0.2)"
            stroke="#9ca3af"
            strokeWidth="1.5"
            strokeDasharray="4,2"
          />
        )}

        {/* Data polygon */}
        <path
          d={polygonPath}
          fill="rgba(59, 130, 246, 0.3)"
          stroke="#3b82f6"
          strokeWidth="2"
          className="drop-shadow-md"
        />

        {/* Data points */}
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r="5" fill="#3b82f6" className="drop-shadow-sm">
            <title>
              {p.label}: {p.value}%
            </title>
          </circle>
        ))}

        {/* Labels */}
        {points.map((p, i) => (
          <text
            key={i}
            x={p.labelX}
            y={p.labelY}
            textAnchor="middle"
            dominantBaseline="middle"
            className="text-xs fill-gray-600 dark:fill-gray-300 font-medium"
          >
            {p.label}
          </text>
        ))}
      </svg>

      {/* Value list */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((d, i) => (
          <div key={i} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{d.label}</span>
            <span
              className={`font-semibold ${
                d.value >= 70
                  ? 'text-green-600'
                  : d.value >= 50
                    ? 'text-blue-600'
                    : d.value >= 30
                      ? 'text-yellow-600'
                      : 'text-red-600'
              }`}
            >
              {d.value}%
            </span>
          </div>
        ))}
      </div>

      {/* Legend */}
      {showBaseline && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-center gap-6 text-xs text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
            <span>Current</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-block w-3 h-0.5 bg-gray-400" style={{ borderStyle: 'dashed' }} />
            <span>Baseline</span>
          </div>
        </div>
      )}
    </div>
  );
}
