import { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { Banner, Button, Screen, Text, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { env } from '@/config/env';
import { colors, spacing } from '@/theme/tokens';

/**
 * Phone OTP sign-in (Indian +91). In dev the web project uses Supabase *test*
 * OTPs (config.toml) — no real SMS provider is wired (§7) — so the same fixed
 * codes work here once credentials are connected.
 */
export default function PhoneAuth() {
  const { signInWithPhone, verifyPhoneOtp } = useAuth();
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [stage, setStage] = useState<'phone' | 'otp'>('phone');
  const [loading, setLoading] = useState(false);

  async function requestOtp() {
    if (phone.replace(/\D/g, '').length < 10) {
      Alert.alert('Invalid number', 'Enter a 10-digit Indian mobile number.');
      return;
    }
    if (!env.isConfigured) {
      Alert.alert('Backend not connected', 'Add Supabase credentials to .env to use phone OTP.');
      return;
    }
    setLoading(true);
    const { error } = await signInWithPhone(phone);
    setLoading(false);
    if (error) {
      Alert.alert('Could not send OTP', error);
      return;
    }
    setStage('otp');
  }

  async function verify() {
    if (otp.trim().length < 4) {
      Alert.alert('Invalid code', 'Enter the OTP you received.');
      return;
    }
    setLoading(true);
    const { error } = await verifyPhoneOtp(phone, otp);
    setLoading(false);
    if (error) {
      Alert.alert('Verification failed', error);
      return;
    }
    router.replace('/');
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
        <AuthHeader
          title="Sign in with phone"
          subtitle={stage === 'phone' ? 'We’ll text you a one-time code.' : `Enter the code sent to ${phone}.`}
        />

        {!env.isConfigured ? (
          <Banner tone="warning" title="Backend not connected" message="Phone OTP needs real Supabase credentials in .env." />
        ) : null}

        {stage === 'phone' ? (
          <>
            <TextField
              label="Mobile number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              textContentType="telephoneNumber"
              placeholder="+91 98765 43210"
            />
            <Button title="Send code" loading={loading} onPress={requestOtp} fullWidth />
          </>
        ) : (
          <>
            <TextField
              label="One-time code"
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              textContentType="oneTimeCode"
              placeholder="123456"
            />
            <Button title="Verify & continue" loading={loading} onPress={verify} fullWidth />
            <Pressable onPress={() => setStage('phone')}>
              <Text variant="label" color={colors.amberDark} style={{ textAlign: 'center' }}>
                Change number
              </Text>
            </Pressable>
          </>
        )}

        <Pressable onPress={() => router.back()}>
          <Text variant="body" color={colors.muted} style={{ textAlign: 'center' }}>
            Back to email sign-in
          </Text>
        </Pressable>
      </View>
    </Screen>
  );
}
