import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { Banner, Button, Card, OptionChip, Select, Text, TextField } from '@/components/ui';
import { LoadingState } from '@/components/QueryStates';
import { UpgradePrompt } from '@/components/UpgradePrompt';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { createResource } from '@/features/resources/queries';
import { RESOURCE_TYPE_LABEL, type ResourceType } from '@/features/resources/types';
import { canPost } from '@/lib/tier';
import { colors, spacing } from '@/theme/tokens';

const LEVEL_TO_UPLOAD = 2;
const ACCEPTED = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'image/jpeg', 'image/png'];
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB (§2.84)

export default function UploadResourceScreen() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<ResourceType>('lesson_plan');
  const [subject, setSubject] = useState('');
  const [shared, setShared] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);

  async function pickFile() {
    const res = await DocumentPicker.getDocumentAsync({ type: ACCEPTED, copyToCacheDirectory: true });
    if (res.canceled || !res.assets?.[0]) return;
    const asset = res.assets[0];
    if (asset.size && asset.size > MAX_BYTES) {
      Alert.alert('File too large', 'Maximum size is 25 MB.');
      return;
    }
    setFileName(asset.name);
    if (!title.trim()) setTitle(asset.name.replace(/\.[^.]+$/, ''));
  }

  const create = useMutation({
    mutationFn: () =>
      createResource(user?.id as string, { title, description, resourceType: type, subject, board: [], grade: [], isSharedPublic: shared }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['resources'] });
      Alert.alert('Uploaded', 'Your resource is in your library. A safety scan runs before it appears in public search.');
      router.back();
    },
    onError: (e) => Alert.alert('Couldn’t upload', (e as Error).message),
  });

  const level = me.data?.level ?? 1;
  const tier = me.data?.tier ?? 'free';
  const allowed = level >= LEVEL_TO_UPLOAD && canPost(tier);
  const canSubmit = title.trim().length >= 3;

  if (me.isLoading) {
    return (
      <Shell>
        <LoadingState />
      </Shell>
    );
  }
  if (!allowed) {
    return (
      <Shell>
        <View style={{ padding: spacing.lg, gap: spacing.md }}>
          <Banner tone="warning" title="Level 2 required" message="Uploading resources unlocks at Level 2 (and Standard tier). Keep contributing to level up." />
          {!canPost(tier) ? <UpgradePrompt requiredTier="standard" feature="Uploading resources" /> : null}
        </View>
      </Shell>
    );
  }

  return (
    <Shell>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg }} keyboardShouldPersistTaps="handled">
        <Card>
          <Button title={fileName ? 'Change file' : 'Choose a file'} variant="secondary" onPress={pickFile} leftIcon={<Ionicons name="document-attach-outline" size={16} color={colors.ink} />} />
          {fileName ? (
            <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }}>
              {fileName}
            </Text>
          ) : (
            <Text variant="caption" color={colors.muted} style={{ marginTop: spacing.sm }}>
              PDF, DOCX, PPTX, XLSX, JPG or PNG · up to 25 MB
            </Text>
          )}
        </Card>

        <TextField label="Title" value={title} onChangeText={setTitle} placeholder="e.g. Class 8 Algebra worksheet" />
        <TextField label="Description" value={description} onChangeText={setDescription} placeholder="What’s inside?" multiline numberOfLines={3} style={{ minHeight: 80, textAlignVertical: 'top' }} />

        <Select label="Type" value={type} options={(Object.keys(RESOURCE_TYPE_LABEL) as ResourceType[]).map((t) => ({ value: t, label: RESOURCE_TYPE_LABEL[t] }))} onChange={(v) => setType(v as ResourceType)} />
        <TextField label="Subject" value={subject} onChangeText={setSubject} placeholder="e.g. Mathematics" />

        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text variant="label">Share to public Resources</Text>
            <Text variant="caption" color={colors.muted}>
              Off keeps it private in your library.
            </Text>
          </View>
          <Switch value={shared} onValueChange={setShared} trackColor={{ true: colors.amber, false: colors.border }} />
        </View>

        <Button title="Upload" loading={create.isPending} disabled={!canSubmit} onPress={() => create.mutate()} fullWidth />
        <Text variant="caption" color={colors.mutedLight} style={{ textAlign: 'center' }}>
          A student-safety scan runs server-side on upload before public listing.
        </Text>
      </ScrollView>
    </Shell>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Upload resource', presentation: 'modal' }} />
      {children}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
