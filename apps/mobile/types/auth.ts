/**
 * TypeScript type definitions for Authentication module
 */

export interface AthleteSignupData {
  // Step 1: Basic Info
  name: string;
  email: string;
  password: string;

  // Step 2: Sport Info
  sport: string;
  position: string;
  year: string;  // Freshman, Sophomore, Junior, Senior
  team?: string;
  age?: number;

  // Step 3: Privacy
  consentCoachView: boolean;
  consentMoodShare: boolean;
  consentGoalsShare: boolean;
  agreedToTerms: boolean;
  understoodDisclaimer: boolean;
}

export interface CoachSignupData {
  // Step 1: Basic Info
  name: string;
  email: string;
  password: string;

  // Step 2: Coaching Info
  sportsCoached: string[];
  organization: string;
  title: string;
  yearsExperience?: number;
  certifications?: string;

  // Step 3: Verification
  verificationCode: string;
  agreedToCodeOfConduct: boolean;
  understoodPrivacy: boolean;
  understoodCompliance: boolean;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'ATHLETE' | 'COACH' | 'ADMIN';
  athlete?: AthleteProfile;
  coach?: CoachProfile;
  onboardingCompleted: boolean;
  createdAt: string;
}

export interface AthleteProfile {
  sport: string;
  position: string;
  year: string;
  team?: string;
  age?: number;
  consentCoachView: boolean;
}

export interface CoachProfile {
  sportsCoached: string[];
  organization: string;
  title: string;
  yearsExperience?: number;
  certifications?: string;
}

export interface VerifyEmailRequest {
  email: string;
}

export interface VerifyEmailResponse {
  success: boolean;
  message: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  valid: boolean;
}
