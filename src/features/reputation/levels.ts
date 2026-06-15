/**
 * Circle Points levels (§9, checklist 2.86/2.120). The DB derives `users.level`
 * from the points ledger; these names + thresholds are the display layer. Tune
 * the thresholds to match the server's `on_points_insert` trigger when confirmed.
 */
export interface LevelDef {
  level: number; // 1–7
  name: string;
  minPoints: number;
  /** Ring colour around the avatar (gold at Level 6+, §2.119). */
  ring: string;
}

export const LEVELS: LevelDef[] = [
  { level: 1, name: 'Newcomer', minPoints: 0, ring: '#C9C4BA' },
  { level: 2, name: 'Contributor', minPoints: 100, ring: '#8FB7A6' },
  { level: 3, name: 'Regular', minPoints: 500, ring: '#5FA8D3' },
  { level: 4, name: 'Mentor', minPoints: 1500, ring: '#7C6FD0' },
  { level: 5, name: 'Leader', minPoints: 4000, ring: '#E07A5F' },
  { level: 6, name: 'Expert', minPoints: 9000, ring: '#F5A400' },
  { level: 7, name: 'Luminary', minPoints: 20000, ring: '#F5A400' },
];

const FALLBACK_LEVEL: LevelDef = { level: 1, name: 'Newcomer', minPoints: 0, ring: '#C9C4BA' };

export function levelDef(level: number): LevelDef {
  return LEVELS.find((l) => l.level === level) ?? FALLBACK_LEVEL;
}

export function levelName(level: number): string {
  return levelDef(level).name;
}

/** Progress info toward the next level given current points. */
export function levelProgress(level: number, points: number): { pct: number; toNext: number; nextName: string | null } {
  const current = levelDef(level);
  const next = LEVELS.find((l) => l.level === level + 1);
  if (!next) return { pct: 1, toNext: 0, nextName: null };
  const span = next.minPoints - current.minPoints;
  const into = Math.max(0, points - current.minPoints);
  return { pct: Math.max(0, Math.min(1, span > 0 ? into / span : 1)), toNext: Math.max(0, next.minPoints - points), nextName: next.name };
}
