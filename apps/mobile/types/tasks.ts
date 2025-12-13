/**
 * TypeScript type definitions for Tasks & Goals module
 */

export interface Task {
  id: string;
  athleteId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  status: TaskStatus;
  estimatedTime?: number;  // minutes
  dueDate?: string;  // ISO date string
  completionPct: number;  // 0-100
  notes?: string;
  tags: string[];  // ["#mental", "#practice"]
  attachments?: Attachment[];

  // AI features
  aiSuggested: boolean;
  aiReason?: string;

  // Linking
  goalId?: string;
  goal?: Goal;

  // Timestamps
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Goal {
  id: string;
  athleteId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  status: GoalStatus;

  // Progress
  targetMetric?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  completionPct: number;

  // Timeline
  startDate: string;
  targetDate?: string;
  completedAt?: string;

  // Hierarchy
  parentGoalId?: string;
  parentGoal?: Goal;
  childGoals?: Goal[];

  // Related
  tasks?: Task[];

  // Timestamps
  createdAt: string;
  updatedAt: string;
}

export interface TaskPattern {
  id: string;
  athleteId: string;
  weekStart: string;

  totalTasks: number;
  completedTasks: number;
  completionRate: number;  // 0.0 - 1.0

  performanceRate?: number;
  mentalRate?: number;
  academicRate?: number;

  mostProductiveTime?: 'morning' | 'afternoon' | 'evening';
  avgTasksPerDay?: number;

  currentStreak: number;
  longestStreak: number;

  totalHours?: number;
  loadStatus?: 'LOW' | 'OPTIMAL' | 'HIGH' | 'OVERLOAD';

  calculatedAt: string;
}

export interface TaskSuggestion {
  task: string;
  reason: string;
  priority: TaskPriority;
  estimatedTime: string;
  tags: string[];
  linkedGoal?: string;
}

export interface ReflectionPrompt {
  type: 'completion' | 'pattern' | 'cognitive_load';
  prompt: string;
  taskId?: string;
  pattern?: string;
  recommendation?: string;
}

export type TaskCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'RECOVERY' | 'PERSONAL' | 'OTHER';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'COMPLETED' | 'POSTPONED' | 'CANCELLED';
export type GoalType = 'LONG_TERM' | 'SHORT_TERM';
export type GoalCategory = 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL';
export type GoalStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface Attachment {
  url: string;
  type: string;
  name: string;
}

// API Request/Response types
export interface CreateTaskRequest {
  athleteId: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  estimatedTime?: number;
  dueDate?: string;
  tags?: string[];
  goalId?: string;
}

export interface UpdateTaskRequest {
  title?: string;
  description?: string;
  priority?: TaskPriority;
  status?: TaskStatus;
  completionPct?: number;
  notes?: string;
  dueDate?: string;
}

export interface CreateGoalRequest {
  athleteId: string;
  title: string;
  description?: string;
  category: GoalCategory;
  type: GoalType;
  targetMetric?: string;
  currentValue?: number;
  targetValue?: number;
  unit?: string;
  targetDate?: string;
  parentGoalId?: string;
}

export interface UpdateGoalRequest {
  title?: string;
  description?: string;
  status?: GoalStatus;
  currentValue?: number;
  completionPct?: number;
}
