// Type definitions for the Flow Sports Coach application

import { User, Role, Athlete, Coach, ChatSession, Message, MessageRole } from '@prisma/client'

// ============================================
// USER TYPES
// ============================================

export type UserWithRelations = User & {
  athlete?: Athlete | null
  coach?: Coach | null
  school?: {
    id: string
    name: string
    division: string
  }
}

export type { Role, MessageRole }

// ============================================
// CHAT TYPES
// ============================================

export interface ChatMessage {
  id: string
  role: MessageRole
  content: string
  createdAt: Date
}

export interface ChatSessionWithMessages extends ChatSession {
  messages: Message[]
}

export interface StreamingChatRequest {
  messages: Array<{
    role: 'user' | 'assistant' | 'system'
    content: string
  }>
  athleteId?: string
  sessionId?: string
}

// ============================================
// MOOD TRACKING TYPES
// ============================================

export interface MoodEntry {
  mood: number       // 1-10
  confidence: number // 1-10
  stress: number     // 1-10
  energy?: number    // 1-10
  sleep?: number     // hours
  notes?: string
  tags?: string[]
}

export interface MoodTrends {
  averageMood: number
  averageConfidence: number
  averageStress: number
  trendDirection: 'improving' | 'stable' | 'declining'
  dataPoints: Array<{
    date: string
    mood: number
    confidence: number
    stress: number
  }>
}

// ============================================
// RAG (Retrieval-Augmented Generation) TYPES
// ============================================

export interface KnowledgeBaseEntry {
  id: string
  title: string
  content: string
  source: string
  category: string
  relevanceScore?: number
}

export interface RAGContext {
  query: string
  retrievedDocs: KnowledgeBaseEntry[]
  totalDocs: number
}

// ============================================
// API RESPONSE TYPES
// ============================================

export interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> extends ApiResponse<T> {
  data: T
  pagination: {
    page: number
    pageSize: number
    total: number
    totalPages: number
  }
}

// ============================================
// DASHBOARD TYPES (Coach View)
// ============================================

export interface AthleteSummary {
  id: string
  name: string
  email: string
  sport: string
  year: string
  lastSessionDate?: Date
  totalSessions: number
  recentTopics: string[]
  averageMood: number
  averageConfidence: number
  flagged: boolean // For concerning patterns
}

export interface CoachDashboardData {
  athletes: AthleteSummary[]
  overview: {
    totalAthletes: number
    activeSessions: number
    averageMoodAcrossTeam: number
    flaggedAthletes: number
  }
}

// ============================================
// GOAL TYPES
// ============================================

export interface GoalWithProgress {
  id: string
  title: string
  description?: string
  category: 'PERFORMANCE' | 'MENTAL' | 'ACADEMIC' | 'PERSONAL'
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED'
  targetDate?: Date
  completedAt?: Date
  progress: number // 0-100
}

// ============================================
// FORM TYPES
// ============================================

export interface SignUpFormData {
  email: string
  password: string
  name: string
  role: Role
  sport?: string
  year?: string
  schoolId: string
}

export interface LoginFormData {
  email: string
  password: string
}

export interface MoodLogFormData extends MoodEntry {
  athleteId: string
}

// ============================================
// SESSION STORAGE TYPES
// ============================================

export interface ChatSessionMetadata {
  sessionId: string
  athleteId: string
  startTime: Date
  lastMessageTime: Date
  messageCount: number
  topic?: string
}
