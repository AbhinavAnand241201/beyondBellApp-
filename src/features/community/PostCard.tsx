import { memo, useState } from 'react';
import { Alert, Image, Pressable, Share, StyleSheet, View } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Avatar, Card, Pill, Text } from '@/components/ui';
import { ReportSheet } from './ReportSheet';
import { flagPost, toggleBookmark } from './mutations';
import { useAuth } from '@/providers/AuthProvider';
import { colors, radius, spacing } from '@/theme/tokens';
import { roleLabel, timeAgo } from '@/lib/format';
import type { EmojiType } from '@/types/db';
import { EMOJI_GLYPH, EMOJI_ORDER, POST_TYPE_LABEL, type FeedPost } from './types';

export interface PostCardProps {
  post: FeedPost;
  onToggleReaction: (post: FeedPost, emoji: EmojiType) => void;
  onOpenReplies: (post: FeedPost) => void;
}

/** Presentational feed card. Reaction/reply behaviour is injected by the shell. */
function PostCardBase({ post, onToggleReaction, onOpenReplies }: PostCardProps) {
  const { user } = useAuth();
  const typeLabel = POST_TYPE_LABEL[post.postType];
  // Color-coded activity cards (left border + pale tint) for briefing/announcement.
  const accent =
    post.postType === 'morning_briefing'
      ? { borderLeftWidth: 4, borderLeftColor: colors.amber, backgroundColor: '#FFFBEB' }
      : post.postType === 'announcement'
        ? { borderLeftWidth: 4, borderLeftColor: '#3B82F6', backgroundColor: '#EFF6FF' }
        : null;
  const [expanded, setExpanded] = useState(false);
  const [saved, setSaved] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const isLong = post.bodyText.length > 200;

  async function onSave() {
    if (!user?.id) return;
    try {
      const next = await toggleBookmark(user.id, post.id, saved);
      setSaved(next);
    } catch (e) {
      Alert.alert('Couldn’t save', (e as Error).message);
    }
  }

  function onShare() {
    void Share.share({ message: post.bodyText });
  }

  function openMenu() {
    Alert.alert('Post', undefined, [
      { text: saved ? 'Unsave' : 'Save', onPress: onSave },
      { text: 'Report', style: 'destructive', onPress: () => setReportOpen(true) },
      { text: 'Share', onPress: onShare },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  async function onReport(reason: string) {
    setReportOpen(false);
    if (!user?.id) return;
    try {
      await flagPost(user.id, post.id, reason);
      Alert.alert('Report submitted', 'Thanks — our team will review this post.');
    } catch (e) {
      Alert.alert('Couldn’t report', (e as Error).message);
    }
  }

  // Author-visible "under review" state when a moderator has hidden the post (§2.115).
  if (post.isHidden) {
    return (
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Ionicons name="eye-off-outline" size={18} color={colors.muted} />
          <Text variant="body" color={colors.muted} style={{ flex: 1 }}>
            Post under review
          </Text>
        </View>
      </Card>
    );
  }

  return (
    <Card style={[styles.card, accent]}>
      {/* Author row */}
      <View style={styles.header}>
        <Pressable
          style={styles.authorTap}
          onPress={() => router.push(`/(main)/profile/${post.author.id}`)}
        >
          <Avatar uri={post.author.avatarUrl} name={post.author.displayName} size={40} />
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text variant="label">{post.author.displayName}</Text>
              {post.isPinned ? <Ionicons name="pin" size={13} color={colors.amberDark} /> : null}
            </View>
            <Text variant="caption" color={colors.muted}>
              {roleLabel(post.author.role)} · Lvl {post.author.level} · {timeAgo(post.createdAt)}
            </Text>
          </View>
        </Pressable>
        {typeLabel ? <Pill label={typeLabel} tone="amber" /> : null}
        <Pressable onPress={openMenu} hitSlop={8} accessibilityLabel="Post options">
          <Ionicons name="ellipsis-horizontal" size={18} color={colors.muted} />
        </Pressable>
      </View>

      {/* Body */}
      <Text variant="body" style={{ marginTop: spacing.md, lineHeight: 22 }} numberOfLines={expanded ? undefined : 4}>
        {post.bodyText}
      </Text>
      {isLong && !expanded ? (
        <Pressable onPress={() => setExpanded(true)} hitSlop={6}>
          <Text variant="label" color={colors.amberDark} style={{ marginTop: 2 }}>
            Read more
          </Text>
        </Pressable>
      ) : null}

      {post.imageUrl ? <Image source={{ uri: post.imageUrl }} style={styles.image} resizeMode="cover" /> : null}

      {/* Reactions + replies */}
      <View style={styles.actions}>
        <View style={styles.reactions}>
          {EMOJI_ORDER.map((emoji) => {
            const count = post.reactionCounts[emoji] ?? 0;
            const active = post.myReaction === emoji;
            if (count === 0 && !active) {
              // Hide zero-count emojis except the first two, to keep the row light.
              if (emoji !== 'thumbs_up' && emoji !== 'heart') return null;
            }
            return (
              <Pressable
                key={emoji}
                onPress={() => onToggleReaction(post, emoji)}
                style={[styles.reaction, active && styles.reactionActive]}
              >
                <Text style={{ fontSize: 14 }}>{EMOJI_GLYPH[emoji]}</Text>
                {count > 0 ? (
                  <Text variant="caption" color={active ? colors.ink : colors.muted}>
                    {count}
                  </Text>
                ) : null}
              </Pressable>
            );
          })}
        </View>

        <Pressable onPress={() => onOpenReplies(post)} style={styles.replyBtn} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={16} color={colors.muted} />
          <Text variant="caption" color={colors.muted}>
            {post.replyCount}
          </Text>
        </Pressable>
      </View>

      <ReportSheet visible={reportOpen} onClose={() => setReportOpen(false)} onSelect={onReport} />
    </Card>
  );
}

export const PostCard = memo(PostCardBase);

const styles = StyleSheet.create({
  card: { borderRadius: 16, borderColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  authorTap: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  image: {
    marginTop: spacing.md,
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: radius.sm,
    backgroundColor: colors.canvas,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actions: {
    marginTop: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reactions: { flexDirection: 'row', gap: spacing.xs, flexWrap: 'wrap', flex: 1 },
  reaction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.canvas,
  },
  reactionActive: { backgroundColor: '#FCE8B8' },
  replyBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: spacing.sm },
});
