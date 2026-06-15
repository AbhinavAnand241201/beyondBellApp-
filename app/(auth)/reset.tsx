import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { Banner, Button, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function ResetRequest() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit() {
    if (!email.trim()) {
      Alert.alert('Enter your email', 'We’ll send a reset link to it.');
      return;
    }
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to reset your password.');
      return;
    }
    setLoading(true);
    const { error } = await resetPassword(email);
    setLoading(false);
    if (error) {
      Alert.alert('Couldn’t send reset email', error);
      return;
    }
    setSent(true);
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
        <AuthHeader title="Reset password" subtitle="We’ll email you a secure link to set a new password." />
        {sent ? (
          <Banner tone="info" title="Check your inbox" message={`If an account exists for ${email}, a reset link is on its way. Open it on this device to continue.`} />
        ) : (
          <>
            <TextField label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" placeholder="you@school.edu" />
            <Button title="Send reset link" loading={loading} onPress={onSubmit} fullWidth />
          </>
        )}
        <Button title="Back to sign in" variant="ghost" onPress={() => router.replace('/(auth)/sign-in')} />
      </View>
    </Screen>
  );
}
