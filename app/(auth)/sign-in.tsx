import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { Link, router } from 'expo-router';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { SocialAuth } from '@/components/auth/SocialAuth';
import { Banner, Button, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function SignIn() {
  const { signInWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter your email and password.');
      return;
    }
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to sign in.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithEmail(email, password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign-in failed', error);
      return;
    }
    // The root gate (`/`) decides dashboard vs. onboarding once the session lands.
    router.replace('/');
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
        <AuthHeader title="Welcome back" subtitle="Sign in to your BeyondBell Circle account." />

        {!env.isConfigured ? (
          <Banner
            tone="warning"
            title="Backend not connected"
            message="Sign-in is wired but needs real Supabase credentials in .env."
          />
        ) : null}

        <TextField
          label="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="you@school.edu"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          textContentType="password"
          placeholder="••••••••"
        />

        <Button title="Sign in" loading={loading} onPress={onSubmit} fullWidth />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Pressable onPress={() => router.push('/(auth)/phone')}>
            <Text variant="label" color={colors.amberDark}>
              Use phone number
            </Text>
          </Pressable>
          <Pressable onPress={() => router.push('/(auth)/reset')}>
            <Text variant="label" color={colors.amberDark}>
              Forgot password?
            </Text>
          </Pressable>
        </View>

        <SocialAuth />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md }}>
          <Text variant="body" color={colors.muted}>
            New here?
          </Text>
          <Link href="/(auth)/sign-up">
            <Text variant="label" color={colors.amberDark}>
              Create an account
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
