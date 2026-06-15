import type { Tier } from '@/types/db';
import { tierAtLeast } from '@/lib/tier';

/**
 * AI tool registry — the RN port of `src/lib/ai/tools.ts` (§11.2, §11.4).
 * Tier limits per the registry; only 4 of 6 tools have a working backend (§11.2),
 * Principal Desk and Compliance are UI-only mocks on web and not available here.
 */
export type ToolId = 'lesson' | 'assessment' | 'parent' | 'event' | 'principal' | 'compliance';

export interface ToolDef {
  id: ToolId;
  label: string;
  description: string;
  minTier: Tier;
  /** Daily limits by tier (free/standard/pro). 0 = not available at that tier. */
  dailyLimits: Record<Tier, number>;
  /** The /api/ai route path (relative to the API base). null = no backend yet. */
  apiPath: string | null;
  icon: string;
  built: boolean;
}

export const TOOLS: ToolDef[] = [
  {
    id: 'lesson',
    label: 'Lesson Architect',
    description: 'Generate a complete, structured lesson plan.',
    minTier: 'free',
    dailyLimits: { free: 2, standard: 10, pro: 30 },
    apiPath: '/api/ai/lesson-architect',
    icon: 'school-outline',
    built: true,
  },
  {
    id: 'assessment',
    label: 'Assessment Builder',
    description: 'Create assessments with an answer key.',
    minTier: 'free',
    dailyLimits: { free: 1, standard: 10, pro: 30 },
    apiPath: '/api/ai/assessment-builder',
    icon: 'create-outline',
    built: true,
  },
  {
    id: 'parent',
    label: 'Parent Communicator',
    description: 'Draft parent messages in multiple tones.',
    minTier: 'free',
    dailyLimits: { free: 3, standard: 10, pro: 30 },
    apiPath: '/api/ai/parent-communicator',
    icon: 'mail-outline',
    built: true,
  },
  {
    id: 'event',
    label: 'Event Architect',
    description: 'Plan a full event pack (Standard+).',
    minTier: 'standard',
    dailyLimits: { free: 0, standard: 5, pro: 15 },
    apiPath: '/api/ai/event-architect',
    icon: 'calendar-outline',
    built: true,
  },
  {
    id: 'principal',
    label: 'Principal Desk',
    description: 'Conversational policy & leadership advisor (Pro).',
    minTier: 'pro',
    dailyLimits: { free: 0, standard: 0, pro: 20 },
    apiPath: '/api/ai/principal-desk',
    icon: 'briefcase-outline',
    built: true,
  },
  {
    id: 'compliance',
    label: 'Compliance Generator',
    description: 'SQAA docs & audit-ready policies (Pro).',
    minTier: 'pro',
    dailyLimits: { free: 0, standard: 0, pro: 10 },
    apiPath: '/api/ai/compliance-generator',
    icon: 'shield-checkmark-outline',
    built: true,
  },
];

export function canAccessTool(tool: ToolDef, tier: Tier): boolean {
  return tierAtLeast(tier, tool.minTier) && tool.dailyLimits[tier] > 0;
}

export function getDailyLimit(tool: ToolDef, tier: Tier): number {
  return tool.dailyLimits[tier];
}

export function getRemaining(tool: ToolDef, tier: Tier, usedToday: number): number {
  return Math.max(0, getDailyLimit(tool, tier) - usedToday);
}

export function getTool(id: ToolId): ToolDef {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown tool: ${id}`);
  return t;
}

/** `ai_tool_usage.tool_name` values, and the arg to `get_daily_tool_usage` (§8.7). */
export const TOOL_DB_NAME: Record<ToolId, string> = {
  lesson: 'lesson_architect',
  assessment: 'assessment_builder',
  parent: 'parent_communicator',
  event: 'event_architect',
  principal: 'principal_desk',
  compliance: 'compliance_generator',
};

export function toolFromDbName(name: string): ToolDef | null {
  const entry = (Object.entries(TOOL_DB_NAME) as [ToolId, string][]).find(([, v]) => v === name);
  return entry ? getTool(entry[0]) : null;
}
