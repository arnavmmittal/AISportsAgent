export interface MoodLog {
  id: string;
  athleteId: string;
  date: Date;
  mood: number;  // 1-10
  confidence: number;  // 1-10
  stress: number;  // 1-10
  energy: number;  // 1-10
  sleep: number;  // hours
  notes?: string;
  tags?: string[];
  createdAt?: Date;
}

export interface MoodStats {
  average: number;
  trend: 'improving' | 'stable' | 'declining';
  streak: number;
  lastLogDate?: Date;
}
