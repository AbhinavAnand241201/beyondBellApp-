import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';

import { Banner, Card, Pill, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { TOOLS, canAccessTool, getDailyLimit, type ToolDef, type ToolId } from '@/features/ai/tools';
import { fetchToolHistory, type ToolUsageItem } from '@/features/ai/usage';
import { toolFromDbName } from '@/features/ai/tools';
import { isApiConfigured } from '@/lib/api';
import { timeAgo } from '@/lib/format';
import type { Tier } from '@/types/db';
import { colors, spacing } from '@/theme/tokens';

/**
 * Tool → screen route map. Add a tool's route here when its screen is built; the
 * grid, chevron and history-open all read from this single source.
 */
const OPEN_ROUTES: Partial<Record<ToolId, string>> = {
  lesson: '/(main)/ai-studio/lesson-architect',
  assessment: '/(main)/ai-studio/assessment-builder',
  parent: '/(main)/ai-studio/parent-communicator',
  event: '/(main)/ai-studio/event-architect',
  principal: '/(main)/ai-studio/principal-desk',
  compliance: '/(main)/ai-studio/compliance-generator',
};

export default function AiStudioTab() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const tier: Tier = me.data?.tier ?? 'free';

  const history = useQuery<ToolUsageItem[]>({
    queryKey: ['ai-history', user?.id],
    queryFn: () => fetchToolHistory(user?.id as string),
    enabled: !!user?.id,
  });

  function openTool(tool: ToolDef) {
    const route = OPEN_ROUTES[tool.id];
    if (route) router.push(route as never);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View>
          <Text variant="h1">AI Studio</Text>
          <Text variant="body" color={colors.muted}>
            Generate teaching documents in seconds.
          </Text>
        </View>

        {!isApiConfigured ? (
          <Banner
            tone="info"
            title="AI backend not connected"
            message="Set EXPO_PUBLIC_API_BASE_URL to the deployed Next.js API (or Edge Functions) to run the tools."
          />
        ) : null}

        <View style={{ gap: spacing.md }}>
          {TOOLS.map((tool) => {
            const accessible = canAccessTool(tool, tier);
            const limit = getDailyLimit(tool, tier);
            return (
              <Pressable key={tool.id} onPress={() => openTool(tool)} disabled={!tool.built}>
                <Card style={{ opacity: tool.built ? 1 : 0.6 }}>
                  <View style={styles.toolRow}>
                    <View style={styles.iconWrap}>
                      <Ionicons name={tool.icon as keyof typeof Ionicons.glyphMap} size={22} color={colors.ink} />
                    </View>
                    <View style={{ flex: 1, gap: 2 }}>
                      <View style={styles.titleRow}>
                        <Text variant="label">{tool.label}</Text>
                        {!tool.built ? <Pill label="Soon" tone="neutral" /> : !accessible ? <Pill label="Upgrade" tone="amber" /> : null}
                      </View>
                      <Text variant="caption" color={colors.muted}>
                        {tool.description}
                      </Text>
                      {tool.built && accessible ? (
                        <Text variant="caption" color={colors.muted}>
                          {limit} / day on your plan
                        </Text>
                      ) : null}
                    </View>
                    {OPEN_ROUTES[tool.id] && tool.built ? (
                      <Ionicons name="chevron-forward" size={18} color={colors.mutedLight} />
                    ) : null}
                  </View>
                </Card>
              </Pressable>
            );
          })}
        </View>

        {/* Recent generations */}
        <View style={{ gap: spacing.sm }}>
          <Text variant="h3">Recent</Text>
          {history.isLoading ? (
            <Text variant="caption" color={colors.muted}>
              Loading…
            </Text>
          ) : (history.data?.length ?? 0) === 0 ? (
            <Text variant="caption" color={colors.muted}>
              Nothing yet — generate something above.
            </Text>
          ) : (
            history.data?.slice(0, 8).map((item: ToolUsageItem) => {
              const itemTool = toolFromDbName(item.toolName);
              const route = itemTool ? OPEN_ROUTES[itemTool.id] : undefined;
              const openable = !!route;
              return (
                <Pressable
                  key={item.id}
                  disabled={!openable}
                  onPress={() => route && router.push(route as never)}
                >
                  <Card>
                    <View style={styles.titleRow}>
                      <Text variant="label" style={{ flex: 1 }} numberOfLines={1}>
                        {item.title}
                      </Text>
                      {item.sharedToCommunity ? <Pill label="Shared" tone="success" /> : null}
                      {openable ? <Ionicons name="chevron-forward" size={16} color={colors.mutedLight} /> : null}
                    </View>
                    <Text variant="caption" color={colors.muted}>
                      {itemTool?.label ?? item.toolName} · {timeAgo(item.createdAt)}
                    </Text>
                  </Card>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.canvas },
  toolRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#FCE8B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
});
