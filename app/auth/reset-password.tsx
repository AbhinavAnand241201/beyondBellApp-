import { useState } from 'react';
import { Alert, View } from 'react-native';
import { router } from 'expo-router';

import { AuthHeader } from '@/components/auth/AuthHeader';
import { Button, Screen, TextField } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { spacing } from '@/theme/tokens';

/**
 * New-password screen — the target of the password-reset deep link (§2.11). The
 * recovery link establishes a temporary session; the user sets a new password
 * here. Lives outside the (main) guard so it's reachable while signed out.
 */
export default function ResetPasswordScreen() {
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    if (password.length < 6) {
      Alert.alert('Too short', 'Use at least 6 characters.');
      return;
    }
    setLoading(true);
    const { error } = await updatePassword(password);
    setLoading(false);
    if (error) {
      Alert.alert('Couldn’t update password', error);
      return;
    }
    Alert.alert('Password updated', 'You can now use your new password.');
    router.replace('/');
  }

  return (
    <Screen scroll>
      <View style={{ gap: spacing.lg, paddingTop: spacing.xl }}>
        <AuthHeader title="Set a new password" subtitle="Choose a strong password you’ll remember." />
        <TextField label="New password" value={password} onChangeText={setPassword} secureTextEntry textContentType="newPassword" placeholder="At least 6 characters" />
        <Button title="Update password" loading={loading} onPress={onSubmit} fullWidth />
      </View>
    </Screen>
  );
}
