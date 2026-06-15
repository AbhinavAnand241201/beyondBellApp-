/**
 * Badge catalog (§9 — 28 badge types, checklist 2.88). `slug` must match
 * `badges.badge_type` in the DB; earned badges are matched by slug. Icons use
 * Ionicons names. Adjust slugs/criteria here to match the server's badge rules.
 */
export interface BadgeDef {
  slug: string;
  label: string;
  criteria: string;
  icon: string;
}

export const BADGE_CATALOG: BadgeDef[] = [
  { slug: 'welcome_week', label: 'Welcome Week', criteria: 'Complete 80% of onboarding in week 1', icon: 'sparkles-outline' },
  { slug: 'first_post', label: 'First Post', criteria: 'Publish your first post', icon: 'create-outline' },
  { slug: 'first_reply', label: 'First Reply', criteria: 'Reply to a post', icon: 'chatbubble-outline' },
  { slug: 'helpful_5', label: 'Helpful Hand', criteria: '5 replies marked helpful', icon: 'hand-left-outline' },
  { slug: 'helpful_25', label: 'Trusted Helper', criteria: '25 replies marked helpful', icon: 'heart-outline' },
  { slug: 'resource_first', label: 'Resource Sharer', criteria: 'Share your first resource', icon: 'document-outline' },
  { slug: 'resource_loved', label: 'Crowd Favourite', criteria: 'A resource rated 4★+ by 10 peers', icon: 'star-outline' },
  { slug: 'streak_7', label: '7-Day Streak', criteria: 'Active 7 days in a row', icon: 'flame-outline' },
  { slug: 'streak_30', label: '30-Day Streak', criteria: 'Active 30 days in a row', icon: 'flame' },
  { slug: 'lesson_10', label: 'Lesson Pro', criteria: 'Generate 10 lesson plans', icon: 'school-outline' },
  { slug: 'assessment_10', label: 'Assessor', criteria: 'Build 10 assessments', icon: 'checkbox-outline' },
  { slug: 'parent_10', label: 'Communicator', criteria: 'Draft 10 parent messages', icon: 'mail-outline' },
  { slug: 'event_host', label: 'Event Host', criteria: 'Plan an event with the Architect', icon: 'calendar-outline' },
  { slug: 'tool_explorer', label: 'Explorer', criteria: 'Try every AI tool', icon: 'compass-outline' },
  { slug: 'event_attendee', label: 'Attendee', criteria: 'Attend a live event', icon: 'videocam-outline' },
  { slug: 'event_regular', label: 'Regular Attendee', criteria: 'Attend 5 live events', icon: 'tv-outline' },
  { slug: 'connector_10', label: 'Connector', criteria: 'Follow 10 educators', icon: 'people-outline' },
  { slug: 'popular_10', label: 'Popular', criteria: 'Gain 10 followers', icon: 'megaphone-outline' },
  { slug: 'group_creator', label: 'Group Creator', criteria: 'Create a study group', icon: 'people-circle-outline' },
  { slug: 'mentor', label: 'Mentor', criteria: 'Reach Level 4', icon: 'ribbon-outline' },
  { slug: 'leader', label: 'Leader', criteria: 'Reach Level 5', icon: 'trophy-outline' },
  { slug: 'expert', label: 'Expert', criteria: 'Reach Level 6', icon: 'medal-outline' },
  { slug: 'luminary', label: 'Luminary', criteria: 'Reach Level 7', icon: 'star' },
  { slug: 'founding_member', label: 'Founding Member', criteria: 'One of the first 500 members', icon: 'flag-outline' },
  { slug: 'reactor_50', label: 'Encourager', criteria: 'React to 50 posts', icon: 'thumbs-up-outline' },
  { slug: 'win_sharer', label: 'Win Sharer', criteria: 'Share 5 teaching wins', icon: 'happy-outline' },
  { slug: 'curator', label: 'Curator', criteria: 'Save 25 resources', icon: 'bookmark-outline' },
  { slug: 'champion', label: 'Community Champion', criteria: 'Recognised by the BeyondBell team', icon: 'shield-checkmark-outline' },
];
