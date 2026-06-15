import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

export function LoadingState({ label }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <ActivityIndicator color={colors.amber} />
      {label ? (
        <Text variant="caption" color={colors.muted}>
          {label}
        </Text>
      ) : null}
    </View>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.md }}>
      <Ionicons name="alert-circle-outline" size={36} color={colors.danger} />
      <Text variant="h3">Something went wrong</Text>
      <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
        {message ?? 'Please try again.'}
      </Text>
      {onRetry ? <Button title="Retry" variant="secondary" onPress={onRetry} /> : null}
    </View>
  );
}

export function EmptyState({
  icon = 'file-tray-outline',
  title,
  message,
}: {
  icon?: keyof typeof Ionicons.glyphMap;
  title: string;
  message?: string;
}) {
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm }}>
      <Ionicons name={icon} size={36} color={colors.mutedLight} />
      <Text variant="h3">{title}</Text>
      {message ? (
        <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
