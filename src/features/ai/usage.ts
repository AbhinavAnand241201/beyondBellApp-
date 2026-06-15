import { supabase } from '@/lib/supabase';
import { TOOL_DB_NAME, type ToolId } from './tools';

/**
 * Reads over `ai_tool_usage` (§8.7) — the table the mobile AI screens use for
 * history and rate-limit display. `get_daily_tool_usage` returns today's count.
 */

export interface ToolUsageItem {
  id: string;
  toolName: string;
  modelUsed: string | null;
  createdAt: string;
  sharedToCommunity: boolean;
  outputResourceId: string | null;
  /** A short human title pulled from input_data when present. */
  title: string;
}

function deriveTitle(input: unknown): string {
  if (input && typeof input === 'object') {
    const obj = input as Record<string, unknown>;
    for (const key of ['topic', 'title', 'subject', 'eventName', 'lessonTopic']) {
      const v = obj[key];
      if (typeof v === 'string' && v.trim()) return v.trim();
    }
  }
  return 'Generation';
}

/** Recent generations, optionally filtered to one tool. */
export async function fetchToolHistory(userId: string, toolId?: ToolId): Promise<ToolUsageItem[]> {
  let query = supabase
    .from('ai_tool_usage')
    .select('id, tool_name, model_used, created_at, shared_to_community, output_resource_id, input_data')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);

  if (toolId) query = query.eq('tool_name', TOOL_DB_NAME[toolId]);

  const { data, error } = await query;
  if (error) throw error;

  type Raw = {
    id: string;
    tool_name: string;
    model_used: string | null;
    created_at: string;
    shared_to_community: boolean | null;
    output_resource_id: string | null;
    input_data: unknown;
  };

  return ((data ?? []) as Raw[]).map((r) => ({
    id: r.id,
    toolName: r.tool_name,
    modelUsed: r.model_used,
    createdAt: r.created_at,
    sharedToCommunity: r.shared_to_community ?? false,
    outputResourceId: r.output_resource_id,
    title: deriveTitle(r.input_data),
  }));
}

/** Today's usage count for a tool, via the rate-limit RPC (§11.3). */
export async function fetchDailyUsage(userId: string, toolId: ToolId): Promise<number> {
  const { data, error } = await supabase.rpc('get_daily_tool_usage', {
    p_user_id: userId,
    p_tool_name: TOOL_DB_NAME[toolId],
  });
  if (error) throw error;
  return typeof data === 'number' ? data : 0;
}
