import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Button, OptionChip, Segmented, Text, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { createGroup, GROUP_DESC_MAX, GROUP_NAME_MAX, GROUP_SUBJECTS, type CreateGroupInput, type GroupPrivacy } from '@/features/groups/queries';
import { analytics } from '@/lib/analytics';
import { colors, spacing } from '@/theme/tokens';

const MEMBER_OPTIONS = [5, 10, 15, 20, 25, 30];

export default function CreateGroupScreen() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<CreateGroupInput>({ name: '', description: '', privacy: 'public', maxMembers: 15, subjectTag: '' });

  const create = useMutation({
    mutationFn: () => createGroup(user?.id as string, form),
    onSuccess: (groupId) => {
      analytics.track('group_created');
      void queryClient.invalidateQueries({ queryKey: ['my-groups', user?.id] });
      void queryClient.invalidateQueries({ queryKey: ['public-groups'] });
      router.replace(`/(main)/groups/${groupId}`);
    },
    onError: (e) => Alert.alert('Couldn’t create group', (e as Error).message),
  });

  const canSubmit = form.name.trim().length >= 3 && form.subjectTag.length > 0;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'New group', presentation: 'modal' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing.xs }}>
          <TextField label="Group name" value={form.name} onChangeText={(v) => setForm({ ...form, name: v.slice(0, GROUP_NAME_MAX) })} placeholder="e.g. Class 10 Physics Prep" />
          <Text variant="caption" color={colors.muted} style={{ textAlign: 'right' }}>
            {form.name.length}/{GROUP_NAME_MAX}
          </Text>
        </View>

        <View style={{ gap: spacing.xs }}>
          <TextField
            label="Description"
            value={form.description}
            onChangeText={(v) => setForm({ ...form, description: v.slice(0, GROUP_DESC_MAX) })}
            placeholder="What’s this group for?"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <Text variant="caption" color={colors.muted} style={{ textAlign: 'right' }}>
            {form.description.length}/{GROUP_DESC_MAX}
          </Text>
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="label">Subject</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {GROUP_SUBJECTS.map((s) => (
              <OptionChip key={s} label={s} selected={form.subjectTag === s} onPress={() => setForm({ ...form, subjectTag: s })} />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.xs }}>
          <Text variant="label">Privacy</Text>
          <Segmented
            options={[
              { value: 'public', label: 'Public' },
              { value: 'invite_only', label: 'Invite-only' },
            ]}
            value={form.privacy}
            onChange={(v) => setForm({ ...form, privacy: v as GroupPrivacy })}
          />
        </View>

        <View style={{ gap: spacing.sm }}>
          <Text variant="label">Max members</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {MEMBER_OPTIONS.map((n) => (
              <OptionChip key={n} label={`${n}`} selected={form.maxMembers === n} onPress={() => setForm({ ...form, maxMembers: n })} />
            ))}
          </View>
        </View>

        <Button title="Create group" loading={create.isPending} disabled={!canSubmit} onPress={() => create.mutate()} fullWidth />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
