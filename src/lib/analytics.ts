/**
 * Analytics façade (checklist 2.7 / 1.32). A thin, PostHog-shaped wrapper so the
 * app can fire the SAME event names as the web app from one place. It is a no-op
 * until a PostHog key is provided — wire the real client in `init()` when
 * `EXPO_PUBLIC_POSTHOG_KEY` is available (see docs/ai-reference/ARCHITECTURE.md §7).
 *
 * Canonical event names (keep in sync with web — checklist 1.32):
 *   tool_used · post_created · post_reacted · reply_created · resource_downloaded
 *   resource_rated · feed_viewed · dm_sent · event_rsvp · space_joined
 *   group_created · group_joined · upgrade_viewed · upgrade_started · ai_shortcut_clicked
 */
export type AnalyticsEvent =
  | 'tool_used'
  | 'post_created'
  | 'post_reacted'
  | 'reply_created'
  | 'resource_downloaded'
  | 'resource_rated'
  | 'feed_viewed'
  | 'dm_sent'
  | 'event_rsvp'
  | 'space_joined'
  | 'group_created'
  | 'group_joined'
  | 'upgrade_viewed'
  | 'upgrade_started'
  | 'ai_shortcut_clicked';

type Props = Record<string, string | number | boolean | null | undefined>;

let enabled = false;

export const analytics = {
  init() {
    // TODO: initialise PostHog with EXPO_PUBLIC_POSTHOG_KEY when provided.
    enabled = false;
  },
  identify(_userId: string, _props?: Props) {
    if (!enabled) return;
  },
  track(event: AnalyticsEvent, _props?: Props) {
    if (!enabled) return;
    // posthog.capture(event, props)
  },
  screen(_name: string, _props?: Props) {
    if (!enabled) return;
  },
};
