import { useState } from 'react';
import { Alert, View } from 'react-native';
import { Link, router } from 'expo-router';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { SocialAuth } from '@/components/auth/SocialAuth';
import { Banner, Button, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

export default function SignUp() {
  const { signUpWithEmail } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (!email || password.length < 6) {
      Alert.alert('Check your details', 'Enter an email and a password of at least 6 characters.');
      return;
    }
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to sign up.');
      return;
    }
    setLoading(true);
    const { error } = await signUpWithEmail(email, password);
    setLoading(false);
    if (error) {
      Alert.alert('Sign-up failed', error);
      return;
    }
    // handle_new_user provisions the DB rows; the gate routes to onboarding next.
    router.replace('/');
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
        <AuthHeader title="Join the Circle" subtitle="Create your account to get started." />

        {!env.isConfigured ? (
          <Banner tone="warning" title="Backend not connected" message="Sign-up needs real Supabase credentials in .env." />
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
          textContentType="newPassword"
          placeholder="At least 6 characters"
          hint="Use 6+ characters."
        />

        <Button title="Create account" loading={loading} onPress={onSubmit} fullWidth />

        <SocialAuth />

        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.xs, marginTop: spacing.md }}>
          <Text variant="body" color={colors.muted}>
            Already have an account?
          </Text>
          <Link href="/(auth)/sign-in">
            <Text variant="label" color={colors.amberDark}>
              Sign in
            </Text>
          </Link>
        </View>
      </View>
    </Screen>
  );
}
