import { ActivityIndicator, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Button, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';

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
    <View style={{ flex: 1, minHeight: 400, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xxl }}>
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: radius.lg,
          backgroundColor: '#F3F4F6',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: spacing.lg,
        }}
      >
        <Ionicons name={icon} size={32} color={colors.mutedLight} />
      </View>
      <Text variant="h3" style={{ textAlign: 'center' }}>
        {title}
      </Text>
      {message ? (
        <Text variant="body" color={colors.mutedLight} style={{ textAlign: 'center', marginTop: spacing.sm }}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}
