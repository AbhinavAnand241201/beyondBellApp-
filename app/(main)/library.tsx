import { ResourceBrowser } from '@/features/resources/ResourceBrowser';

// My Library — the user's own resources, private + shared (§15).
export default function LibraryScreen() {
  return <ResourceBrowser mode="library" title="My Library" />;
}
