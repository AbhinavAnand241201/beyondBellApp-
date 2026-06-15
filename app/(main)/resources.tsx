import { ResourceBrowser } from '@/features/resources/ResourceBrowser';

// Public Resources — community-shared, behind the 2-rating quality gate (§15).
export default function ResourcesScreen() {
  return <ResourceBrowser mode="public" title="Resources" />;
}
