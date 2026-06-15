import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import { Ionicons } from '@expo/vector-icons';

import { Text } from '@/components/ui';
import { colors, spacing } from '@/theme/tokens';

/**
 * Top "no internet" banner (§2.140). Non-blocking — cached content stays usable
 * beneath it. Mounted once at the app root.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      setOffline(state.isConnected === false);
    });
    return () => unsub();
  }, []);

  if (!offline) return null;

  return (
    <SafeAreaView edges={['top']} style={styles.wrap}>
      <View style={styles.row}>
        <Ionicons name="cloud-offline-outline" size={15} color="#FFFFFF" />
        <Text variant="caption" color="#FFFFFF">
          No internet connection
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  wrap: { backgroundColor: colors.ink },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: 6 },
});
