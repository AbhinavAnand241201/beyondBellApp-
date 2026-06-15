/** `direct_messages` row (§8.6), camelCased for the UI. */
export interface DirectMessage {
  id: string;
  senderId: string;
  recipientId: string;
  bodyText: string;
  readAt: string | null;
  createdAt: string;
}

/** One conversation summary in the messages list. */
export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerAvatar: string | null;
  lastMessage: string;
  lastAt: string;
  /** True if the latest message was sent by me. */
  lastFromMe: boolean;
  unreadCount: number;
}

export const DM_MAX_LENGTH = 1000; // matches the DB CHECK on direct_messages.body_text
