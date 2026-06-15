import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { Avatar, Banner, Button, Card, OptionChip, Pill, Text, TextField } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import {
  containsLink,
  createPost,
  fetchPostableRooms,
  pickCompressAndUpload,
  POST_MAX_LENGTH,
  POST_TYPE_OPTIONS,
  type RoomOption,
} from '@/features/community/compose';
import { feedQueryKey } from '@/features/community/useFeed';
import { POST_TYPE_LABEL } from '@/features/community/types';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { canPost, tierAtLeast } from '@/lib/tier';
import { roleLabel } from '@/lib/format';
import { analytics } from '@/lib/analytics';
import type { PostType } from '@/types/db';
import { colors, radius, spacing } from '@/theme/tokens';

interface Draft {
  body: string;
  postType: PostType;
  roomId: string | null;
}

export default function Compose() {
  const { user, emailVerified } = useAuth();
  const { roomId: paramRoomId } = useLocalSearchParams<{ roomId?: string }>();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();
  const draftKey = `draft:post:${user?.id}`;

  const [body, setBody] = useState('');
  const [postType, setPostType] = useState<PostType>('discussion');
  const [roomId, setRoomId] = useState<string | null>(paramRoomId ?? null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState(false);
  const [aiDismissed, setAiDismissed] = useState(false);
  const [draftSaved, setDraftSaved] = useState(false);

  const rooms = useQuery<RoomOption[]>({
    queryKey: ['postable-rooms', user?.id],
    queryFn: () => fetchPostableRooms(user?.id as string),
    enabled: !!user?.id && canPost(me.data?.tier ?? 'free'),
  });

  const selectedRoom = useMemo<RoomOption | null>(
    () => rooms.data?.find((r: RoomOption) => r.roomId === roomId) ?? rooms.data?.[0] ?? null,
    [rooms.data, roomId],
  );

  const tier = me.data?.tier ?? 'free';
  const isFree = !tierAtLeast(tier, 'standard');
  const overLimit = body.length > POST_MAX_LENGTH;
  const linkBlocked = isFree && containsLink(body);

  // Resume draft on mount.
  useEffect(() => {
    if (!user?.id) return;
    AsyncStorage.getItem(draftKey).then((raw) => {
      if (!raw) return;
      const d = JSON.parse(raw) as Draft;
      if (!d.body?.trim()) return;
      Alert.alert('Resume draft?', 'You have an unsent draft.', [
        { text: 'Discard', style: 'destructive', onPress: () => AsyncStorage.removeItem(draftKey) },
        { text: 'Resume', onPress: () => { setBody(d.body); setPostType(d.postType); setRoomId(d.roomId); } },
      ]);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Auto-save every 30s while there's content.
  useEffect(() => {
    if (!user?.id) return;
    const t = setInterval(() => {
      if (body.trim()) {
        void AsyncStorage.setItem(draftKey, JSON.stringify({ body, postType, roomId } satisfies Draft));
        setDraftSaved(true);
        setTimeout(() => setDraftSaved(false), 1500);
      }
    }, 30_000);
    return () => clearInterval(t);
  }, [body, postType, roomId, user?.id, draftKey]);

  async function onPickImage() {
    setUploading(true);
    const url = await pickCompressAndUpload(user?.id as string);
    setUploading(false);
    if (url) setImageUrl(url);
    else Alert.alert('Couldn’t attach image', 'Image storage may not be configured yet.');
  }

  const submit = useMutation({
    mutationFn: () => createPost(user?.id as string, (selectedRoom as RoomOption).roomId, body, postType, imageUrl),
    onSuccess: async () => {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      analytics.track('post_created', { postType });
      await AsyncStorage.removeItem(draftKey);
      void queryClient.invalidateQueries({ queryKey: feedQueryKey(user?.id) });
      router.back();
    },
    onError: (err) => Alert.alert('Couldn’t post', (err as Error).message),
  });

  const canSubmit = body.trim().length > 0 && !overLimit && !!selectedRoom && emailVerified && !linkBlocked;
  const showAiShortcut = body.includes('?') && !aiDismissed;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen
        options={{
          headerShown: true,
          title: preview ? 'Preview' : 'New post',
          presentation: 'modal',
          headerRight: () =>
            draftSaved ? (
              <Text variant="caption" color={colors.muted}>
                Draft saved
              </Text>
            ) : null,
        }}
      />

      {me.isLoading ? (
        <LoadingState />
      ) : !canPost(tier) ? (
        <View style={{ padding: spacing.lg, gap: spacing.lg }}>
          <UpgradePrompt requiredTier="standard" feature="Posting to the community" />
          <Button title="Close" variant="secondary" onPress={() => router.back()} />
        </View>
      ) : preview ? (
        <PreviewPane
          author={{ name: me.data?.displayName ?? 'You', avatar: me.data?.avatarUrl ?? null, role: me.data?.role ?? 'classroom_teacher' }}
          body={body}
          postType={postType}
          imageUrl={imageUrl}
          onBack={() => setPreview(false)}
          onPublish={() => submit.mutate()}
          publishing={submit.isPending}
          canSubmit={canSubmit}
        />
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
          {!emailVerified ? (
            <Banner tone="warning" title="Verify your email to post" message="Check your inbox for the verification link. You can still use AI Studio meanwhile." />
          ) : null}

          {/* Post type */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="label">Type</Text>
            <View style={styles.chipWrap}>
              {POST_TYPE_OPTIONS.map((t) => (
                <OptionChip key={t.value} label={t.label} selected={postType === t.value} onPress={() => setPostType(t.value)} />
              ))}
            </View>
          </View>

          {/* Room picker */}
          <View style={{ gap: spacing.sm }}>
            <Text variant="label">Post to</Text>
            {rooms.isLoading ? (
              <Text variant="caption" color={colors.muted}>
                Loading your spaces…
              </Text>
            ) : (rooms.data?.length ?? 0) === 0 ? (
              <Text variant="caption" color={colors.muted}>
                You haven’t joined any spaces you can post in yet.
              </Text>
            ) : (
              <View style={styles.chipWrap}>
                {rooms.data?.map((r: RoomOption) => (
                  <OptionChip key={r.roomId} label={`${r.spaceName} · ${r.roomName}`} selected={(selectedRoom?.roomId ?? null) === r.roomId} onPress={() => setRoomId(r.roomId)} />
                ))}
              </View>
            )}
          </View>

          {/* Body */}
          <View style={{ gap: spacing.xs }}>
            <TextField
              label="Your post"
              value={body}
              onChangeText={setBody}
              placeholder="Share something with your community…"
              multiline
              numberOfLines={6}
              style={{ minHeight: 140, textAlignVertical: 'top' }}
              error={overLimit ? `Over the ${POST_MAX_LENGTH}-character limit` : linkBlocked ? 'Upgrade to Standard to include links' : null}
            />
            {body.length >= 1200 ? (
              <Text variant="caption" color={overLimit ? colors.danger : colors.muted} style={{ textAlign: 'right' }}>
                {body.length}/{POST_MAX_LENGTH}
              </Text>
            ) : null}
          </View>

          {/* AI shortcut (§2.38) */}
          {showAiShortcut ? (
            <Pressable
              onPress={() => {
                analytics.track('ai_shortcut_clicked');
                router.push('/(main)/ai-studio/lesson-architect');
              }}
            >
              <Banner tone="info" title="Get an AI answer first → Lesson Architect" message="Your post has a question — an AI tool might help." />
            </Pressable>
          ) : null}

          {/* Image */}
          {imageUrl ? (
            <View>
              <Image source={{ uri: imageUrl }} style={styles.image} />
              <Pressable style={styles.removeImg} onPress={() => setImageUrl(null)}>
                <Ionicons name="close-circle" size={24} color={colors.ink} />
              </Pressable>
            </View>
          ) : null}

          {/* Toolbar */}
          <View style={{ flexDirection: 'row', gap: spacing.sm }}>
            <Button title={imageUrl ? 'Replace image' : 'Add image'} variant="secondary" size="sm" loading={uploading} onPress={onPickImage} leftIcon={<Ionicons name="image-outline" size={15} color={colors.ink} />} />
            <Button title="Preview" variant="secondary" size="sm" disabled={!body.trim()} onPress={() => setPreview(true)} leftIcon={<Ionicons name="eye-outline" size={15} color={colors.ink} />} />
          </View>

          <Button title="Publish" loading={submit.isPending} disabled={!canSubmit} onPress={() => submit.mutate()} fullWidth />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

function PreviewPane({
  author,
  body,
  postType,
  imageUrl,
  onBack,
  onPublish,
  publishing,
  canSubmit,
}: {
  author: { name: string; avatar: string | null; role: string };
  body: string;
  postType: PostType;
  imageUrl: string | null;
  onBack: () => void;
  onPublish: () => void;
  publishing: boolean;
  canSubmit: boolean;
}) {
  const typeLabel = POST_TYPE_LABEL[postType];
  return (
    <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }}>
      <Text variant="caption" color={colors.muted}>
        This is how your post will appear in the feed.
      </Text>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <Avatar uri={author.avatar} name={author.name} size={40} />
          <View style={{ flex: 1 }}>
            <Text variant="label">{author.name}</Text>
            <Text variant="caption" color={colors.muted}>
              {roleLabel(author.role)} · now
            </Text>
          </View>
          {typeLabel ? <Pill label={typeLabel} tone="amber" /> : null}
        </View>
        <Text variant="body" style={{ marginTop: spacing.md, lineHeight: 22 }}>
          {body}
        </Text>
        {imageUrl ? <Image source={{ uri: imageUrl }} style={styles.image} /> : null}
      </Card>
      <View style={{ flexDirection: 'row', gap: spacing.md }}>
        <Button title="Edit" variant="secondary" onPress={onBack} style={{ flex: 1 }} />
        <Button title="Publish" loading={publishing} disabled={!canSubmit} onPress={onPublish} style={{ flex: 1 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  chipWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  image: { width: '100%', height: 200, borderRadius: radius.sm, marginTop: spacing.md, backgroundColor: colors.border },
  removeImg: { position: 'absolute', top: spacing.md + 4, right: 8 },
});
