/**
 * Type declarations for Deadline Guardian AI
 */

export interface Goal {
  id: string;
  title: string;
  category: 'exam' | 'assignment' | 'project' | 'hackathon' | 'placement' | 'meeting' | 'interview' | 'certification' | 'deadline';
  targetDate: string; // YYYY-MM-DD
  preparationNeededHours: number;
  availableHoursPerDay: number;
  notes?: string;
  failureRisk: number; // 0 to 100
  reasoning: string;
  recommends: string[];
  createdAt: string;
  expectedSuccessProbability: number; // 100 - failureRisk
  nextBestAction?: string;
  actionDurationMinutes?: number;
  isFallbackUsed?: boolean;
}

export interface DailyAction {
  id: string;
  goalId: string;
  goalTitle: string;
  title: string;
  durationMinutes: number;
  impact: 'highest' | 'high' | 'medium' | 'low';
  completed: boolean;
  scheduledDate: string;
  riskReductionAlert?: string;
}

export interface RealityCheckReport {
  isRealistic: boolean;
  overallSuccessProbability: number;
  totalRequiredEffortHours: number;
  totalAvailableHours: number;
  textFeedback: string;
  prioritizedGoals: { id: string; title: string; priority: number; reason: string }[];
  delayedGoals: { id: string; title: string; delayReason: string }[];
  isFallbackUsed?: boolean;
}

export interface DelaySimulationResult {
  originalRisk: number;
  newRisk: number;
  impactDescription: string;
  recommendedRecoveryAction: string;
  isFallbackUsed?: boolean;
}

export interface RebuildPlanResult {
  success: boolean;
  updatedActions: DailyAction[];
  recoveryStrategy: string;
  rebuiltSuccessProbability: number;
  originalSuccessProbability: number;
  isFallbackUsed?: boolean;
}
