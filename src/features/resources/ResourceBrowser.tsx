import { useMemo, useState } from 'react';
import { FlatList, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useInfiniteQuery } from '@tanstack/react-query';

import { Banner, OptionChip, Text, TextField } from '@/components/ui';
import { EmptyState, ErrorState, LoadingState } from '@/components/QueryStates';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';
import { fetchResourcePage } from './queries';
import { ResourceCard } from './ResourceCard';
import {
  emptyFilters,
  PAGE_SIZE,
  RESOURCE_TYPE_LABEL,
  type Resource,
  type ResourceFilters,
  type ResourceSort,
  type ResourceType,
  type Visibility,
} from './types';

const TYPE_CHOICES = Object.keys(RESOURCE_TYPE_LABEL) as ResourceType[];
const SORTS: { value: ResourceSort; label: string }[] = [
  { value: 'recent', label: 'Recent' },
  { value: 'rating', label: 'Top rated' },
  { value: 'downloads', label: 'Most used' },
];
const VISIBILITY: { value: Visibility; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
];

/** Shared filter+infinite-scroll browser for both Library and public Resources. */
export function ResourceBrowser({ mode, title }: { mode: 'library' | 'public'; title: string }) {
  const { user } = useAuth();
  const [filters, setFilters] = useState<ResourceFilters>(emptyFilters);

  const query = useInfiniteQuery({
    queryKey: ['resources', mode, user?.id, filters],
    queryFn: ({ pageParam }) =>
      fetchResourcePage({ mode, userId: user?.id as string, filters, page: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => (lastPage.length === PAGE_SIZE ? allPages.length : undefined),
    enabled: !!user?.id,
  });

  const items = useMemo<Resource[]>(() => query.data?.pages.flat() ?? [], [query.data]);

  function patch(p: Partial<ResourceFilters>) {
    setFilters((prev) => ({ ...prev, ...p }));
  }

  if (!env.isConfigured) {
    return (
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <Stack.Screen options={{ headerShown: true, title }} />
        <View style={{ padding: spacing.lg }}>
          <Banner tone="warning" title="Backend not connected" message="Connect Supabase in .env to browse resources." />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title }} />
      <FlatList
        data={items}
        keyExtractor={(r) => r.id}
        contentContainerStyle={styles.list}
        ItemSeparatorComponent={() => <View style={{ height: spacing.md }} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
        }}
        ListHeaderComponent={
          <View style={{ gap: spacing.md, marginBottom: spacing.md }}>
            <View style={{ gap: spacing.xs }}>
              <Text variant="display" style={{ fontSize: 28, lineHeight: 34 }}>
                {title}
              </Text>
              <Text variant="body" color={colors.muted}>
                {mode === 'library'
                  ? 'Your saved AI outputs and uploaded resources. Only you can see private items until you share them.'
                  : 'Resources shared by educators across BeyondBell — newest first. Rate what you find useful.'}
              </Text>
            </View>
            <TextField
              value={filters.search}
              onChangeText={(v) => patch({ search: v })}
              placeholder="Search resources…"
              autoCapitalize="none"
            />
            <ChipRow>
              {SORTS.map((s) => (
                <OptionChip key={s.value} label={s.label} selected={filters.sort === s.value} onPress={() => patch({ sort: s.value })} />
              ))}
            </ChipRow>
            {mode === 'library' ? (
              <ChipRow>
                {VISIBILITY.map((v) => (
                  <OptionChip
                    key={v.value}
                    label={v.label}
                    selected={filters.visibility === v.value}
                    onPress={() => patch({ visibility: v.value })}
                  />
                ))}
              </ChipRow>
            ) : null}
            <ChipRow>
              <OptionChip label="Any type" selected={filters.resourceType === null} onPress={() => patch({ resourceType: null })} />
              {TYPE_CHOICES.map((t) => (
                <OptionChip
                  key={t}
                  label={RESOURCE_TYPE_LABEL[t]}
                  selected={filters.resourceType === t}
                  onPress={() => patch({ resourceType: t })}
                />
              ))}
            </ChipRow>
          </View>
        }
        renderItem={({ item }) => (
          <Pressable onPress={() => router.push(`/(main)/resource/${item.id}`)}>
            <ResourceCard resource={item} />
          </Pressable>
        )}
        ListEmptyComponent={
          query.isLoading ? (
            <LoadingState />
          ) : query.isError ? (
            <ErrorState message="Couldn’t load resources." onRetry={() => query.refetch()} />
          ) : (
            <EmptyState
              icon="document-text-outline"
              title="No resources found"
              message={mode === 'library' ? 'Save an AI output or upload to build your library.' : 'Try a different search or filter.'}
            />
          )
        }
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <Text variant="caption" color={colors.muted} style={{ textAlign: 'center', padding: spacing.lg }}>
              Loading more…
            </Text>
          ) : null
        }
      />
      {mode === 'library' ? (
        <Pressable style={styles.fab} onPress={() => router.push('/(main)/resource/upload')} accessibilityLabel="Upload resource">
          <Ionicons name="cloud-upload-outline" size={26} color={colors.ink} />
        </Pressable>
      ) : null}
    </SafeAreaView>
  );
}

function ChipRow({ children }: { children: React.ReactNode }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow} keyboardShouldPersistTaps="handled">
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  list: { padding: spacing.lg, flexGrow: 1 },
  chipRow: { flexDirection: 'row', gap: spacing.sm, paddingRight: spacing.lg },
  fab: {
    position: 'absolute',
    right: spacing.lg,
    bottom: spacing.xl,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.amber,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 5,
  },
});
