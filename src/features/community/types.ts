import type { EmojiType, PostType, ReactionCounts } from '@/types/db';

/** A post as rendered in the feed: the row + its author + the viewer's reaction. */
export interface FeedPost {
  id: string;
  authorId: string;
  roomId: string;
  bodyText: string;
  postType: PostType;
  reactionCounts: ReactionCounts;
  replyCount: number;
  isPinned: boolean;
  isHidden: boolean;
  imageUrl: string | null;
  createdAt: string;
  author: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    role: string;
    level: number;
  };
  /** The emoji the current user has reacted with on this post, if any. */
  myReaction: EmojiType | null;
  /** Space type/name of the post's room — used for the Board/Subject feed tabs. */
  spaceType: string | null;
  spaceName: string | null;
}

/** Emoji glyphs for the 5 reaction types (§8.2). */
export const EMOJI_GLYPH: Record<EmojiType, string> = {
  thumbs_up: '👍',
  heart: '❤️',
  celebrate: '🎉',
  bulb: '💡',
  hands: '🙏',
};

export const EMOJI_ORDER: EmojiType[] = ['thumbs_up', 'heart', 'celebrate', 'bulb', 'hands'];

export const POST_TYPE_LABEL: Partial<Record<PostType, string>> = {
  question: 'Question',
  teaching_win: 'Teaching win',
  resource_share: 'Resource',
  appreciation: 'Appreciation',
  announcement: 'Announcement',
  morning_briefing: 'Morning briefing',
};
