export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  onboardingCompleted?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Athlete extends User {
  sport: string;
  year: number;
  position?: string;
  jerseyNumber?: string;
  teamId?: string;
  consentCoachView: boolean;
  consentChatSummaries: boolean;
  riskLevel?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}

export interface Coach extends User {
  sport: string;
  title: string;
  schoolId?: string;
}
