import { useQuery } from '@tanstack/react-query';

import { fetchDashboard, type DashboardData } from './queries';

export function useDashboard(userId: string | undefined) {
  return useQuery<DashboardData>({
    queryKey: ['dashboard', userId],
    queryFn: () => fetchDashboard(userId as string),
    enabled: !!userId,
  });
}
