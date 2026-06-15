import { useState } from 'react';

/** A stable "now" ISO timestamp captured once on mount (for time-window queries). */
export function useNow(): string {
  const [now] = useState(() => new Date().toISOString());
  return now;
}
