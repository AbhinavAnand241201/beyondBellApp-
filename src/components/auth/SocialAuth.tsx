import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { Button, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

/** "or" divider + Google OAuth button, shared by sign-in and sign-up. */
export function SocialAuth() {
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  async function onGoogle() {
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to enable sign-in.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithGoogle();
    setLoading(false);
    if (error) Alert.alert('Google sign-in failed', error);
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.line} />
        <Text variant="caption">or</Text>
        <View style={styles.line} />
      </View>
      <Button title="Continue with Google" variant="secondary" loading={loading} onPress={onGoogle} fullWidth />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: spacing.md },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  line: { flex: 1, height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
});
