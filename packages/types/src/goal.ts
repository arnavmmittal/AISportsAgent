export interface Goal {
  id: string;
  athleteId: string;
  title: string;
  description?: string;
  category: 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL';
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  progress: number;  // 0-100
  targetDate?: Date;
  createdAt: Date;
  updatedAt: Date;
}
