/**
 * NetworkGraph Component
 * Team chemistry, social network, leadership visualization
 */

'use client';

import { cn } from '@/lib/utils';
import { EmptyChart } from '../ui/EmptyState';
import AthleteAvatar from '../ui/AthleteAvatar';
import { useEffect, useRef, useState } from 'react';

export interface NetworkNode {
  id: string;
  label: string;
  imageUrl?: string;
  group?: string;
  value?: number; // Size/importance
  color?: string;
  metadata?: Record<string, any>;
}

export interface NetworkEdge {
  source: string;
  target: string;
  value?: number; // Connection strength
  label?: string;
  color?: string;
}

interface NetworkGraphProps {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
  height?: number;
  onNodeClick?: (node: NetworkNode) => void;
  emptyMessage?: string;
  className?: string;
}

// Simple force-directed layout (basic implementation)
// For production, consider using D3.js or vis-network
function calculateNodePositions(
  nodes: NetworkNode[],
  edges: NetworkEdge[],
  width: number,
  height: number
) {
  // Initialize positions randomly
  const positions = nodes.map(() => ({
    x: Math.random() * width,
    y: Math.random() * height,
  }));

  // Simple force-directed layout iterations
  const iterations = 50;
  const k = Math.sqrt((width * height) / nodes.length);

  for (let iter = 0; iter < iterations; iter++) {
    // Repulsive forces between all nodes
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = positions[j].x - positions[i].x;
        const dy = positions[j].y - positions[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (k * k) / dist;

        positions[i].x -= (force * dx) / dist;
        positions[i].y -= (force * dy) / dist;
        positions[j].x += (force * dx) / dist;
        positions[j].y += (force * dy) / dist;
      }
    }

    // Attractive forces along edges
    edges.forEach((edge) => {
      const sourceIdx = nodes.findIndex((n) => n.id === edge.source);
      const targetIdx = nodes.findIndex((n) => n.id === edge.target);

      if (sourceIdx === -1 || targetIdx === -1) return;

      const dx = positions[targetIdx].x - positions[sourceIdx].x;
      const dy = positions[targetIdx].y - positions[sourceIdx].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const force = (dist * dist) / k;

      positions[sourceIdx].x += (force * dx) / dist;
      positions[sourceIdx].y += (force * dy) / dist;
      positions[targetIdx].x -= (force * dx) / dist;
      positions[targetIdx].y -= (force * dy) / dist;
    });

    // Keep nodes within bounds
    positions.forEach((pos) => {
      pos.x = Math.max(50, Math.min(width - 50, pos.x));
      pos.y = Math.max(50, Math.min(height - 50, pos.y));
    });
  }

  return positions;
}

export default function NetworkGraph({
  nodes,
  edges,
  height = 500,
  onNodeClick,
  emptyMessage,
  className,
}: NetworkGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerWidth, setContainerWidth] = useState(800);
  const [positions, setPositions] = useState<Array<{ x: number; y: number }>>([]);

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
  }, []);

  useEffect(() => {
    if (nodes.length > 0) {
      setPositions(calculateNodePositions(nodes, edges, containerWidth, height));
    }
  }, [nodes, edges, containerWidth, height]);

  if (!nodes || nodes.length === 0) {
    return <EmptyChart message={emptyMessage} />;
  }

  const maxEdgeValue = Math.max(...edges.map((e) => e.value || 1), 1);

  return (
    <div
      ref={containerRef}
      className={cn('w-full bg-slate-900/50 rounded-lg border border-slate-700 overflow-hidden', className)}
    >
      <svg width="100%" height={height} className="relative">
        {/* Render edges */}
        <g className="edges">
          {edges.map((edge, index) => {
            const sourceIdx = nodes.findIndex((n) => n.id === edge.source);
            const targetIdx = nodes.findIndex((n) => n.id === edge.target);

            if (sourceIdx === -1 || targetIdx === -1 || !positions[sourceIdx] || !positions[targetIdx]) {
              return null;
            }

            const strokeWidth = ((edge.value || 1) / maxEdgeValue) * 3 + 1;

            return (
              <line
                key={index}
                x1={positions[sourceIdx].x}
                y1={positions[sourceIdx].y}
                x2={positions[targetIdx].x}
                y2={positions[targetIdx].y}
                stroke={edge.color || '#94A3B8'}
                strokeWidth={strokeWidth}
                opacity={0.6}
              />
            );
          })}
        </g>

        {/* Render nodes */}
        <g className="nodes">
          {nodes.map((node, index) => {
            if (!positions[index]) return null;

            const nodeSize = (node.value || 1) * 20 + 20;
            const nodeColor = node.color || '#3B82F6';

            return (
              <g
                key={node.id}
                transform={`translate(${positions[index].x}, ${positions[index].y})`}
                className={cn(
                  'cursor-pointer transition-transform hover:scale-110',
                  onNodeClick && 'hover:opacity-80'
                )}
                onClick={() => onNodeClick?.(node)}
              >
                {/* Node circle */}
                <circle
                  r={nodeSize / 2}
                  fill={nodeColor}
                  stroke="#1e293b"
                  strokeWidth={2}
                />

                {/* Node label */}
                <text
                  y={nodeSize / 2 + 16}
                  textAnchor="middle"
                  fill="#e2e8f0"
                  fontSize="11"
                  fontWeight="500"
                  className="pointer-events-none"
                >
                  {node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Legend */}
      <div className="px-4 pb-4">
        <div className="flex items-center gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-secondary" />
            <span>Athlete</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1 h-6 bg-muted" />
            <span>Connection strength</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// Team chemistry network with athlete avatars
export function TeamChemistryNetwork({
  athletes,
  connections,
  onAthleteClick,
}: {
  athletes: Array<{
    id: string;
    name: string;
    imageUrl?: string;
    isLeader?: boolean;
    connectedness?: number;
  }>;
  connections: Array<{ athleteId1: string; athleteId2: string; strength: number }>;
  onAthleteClick?: (athleteId: string) => void;
}) {
  const nodes: NetworkNode[] = athletes.map((athlete) => ({
    id: athlete.id,
    label: athlete.name.split(' ')[0], // First name only
    imageUrl: athlete.imageUrl,
    value: athlete.connectedness || 1,
    color: athlete.isLeader ? '#5BA3F5' : '#3B82F6', // leader: accent (light blue), regular: secondary (bright blue)
    metadata: athlete,
  }));

  const edges: NetworkEdge[] = connections.map((conn) => ({
    source: conn.athleteId1,
    target: conn.athleteId2,
    value: conn.strength,
  }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-300">Team Social Network</h4>
        <div className="flex items-center gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span>Leader</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-500" />
            <span>Team Member</span>
          </div>
        </div>
      </div>

      <NetworkGraph
        nodes={nodes}
        edges={edges}
        height={500}
        onNodeClick={(node) => onAthleteClick?.(node.id)}
        emptyMessage="No team chemistry data available."
      />
    </div>
  );
}

// Clique detection visualization
export function CliqueVisualization({
  cliques,
}: {
  cliques: Array<{
    id: string;
    name: string;
    members: Array<{ id: string; name: string; imageUrl?: string }>;
    color: string;
  }>;
}) {
  // Flatten cliques into nodes with group coloring
  const allNodes: NetworkNode[] = [];
  const allEdges: NetworkEdge[] = [];

  cliques.forEach((clique, cliqueIndex) => {
    clique.members.forEach((member) => {
      if (!allNodes.find((n) => n.id === member.id)) {
        allNodes.push({
          id: member.id,
          label: member.name.split(' ')[0],
          imageUrl: member.imageUrl,
          group: clique.id,
          color: clique.color,
          value: 1,
        });
      }

      // Connect all members within the clique
      clique.members.forEach((otherMember) => {
        if (member.id !== otherMember.id) {
          const edgeExists = allEdges.some(
            (e) =>
              (e.source === member.id && e.target === otherMember.id) ||
              (e.source === otherMember.id && e.target === member.id)
          );

          if (!edgeExists) {
            allEdges.push({
              source: member.id,
              target: otherMember.id,
              value: 2,
              color: clique.color,
            });
          }
        }
      });
    });
  });

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium text-slate-300">Social Cliques</h4>

      <NetworkGraph
        nodes={allNodes}
        edges={allEdges}
        height={500}
        emptyMessage="No clique data available."
      />

      {/* Clique legend */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {cliques.map((clique) => (
          <div
            key={clique.id}
            className="flex items-center gap-2 p-2 rounded-md bg-slate-800/50 border border-slate-700"
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: clique.color }}
            />
            <div>
              <div className="text-xs font-medium text-slate-200">{clique.name}</div>
              <div className="text-[10px] text-slate-400">
                {clique.members.length} members
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
