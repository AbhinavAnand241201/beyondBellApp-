import { Modal, Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@/theme/tokens';
import { Text } from './Text';

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

/** Modal bottom sheet: tap-scrim to dismiss, grabber, optional title. */
export function BottomSheet({ visible, onClose, title, children }: BottomSheetProps) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.scrim} onPress={onClose} />
      <SafeAreaView style={styles.sheetWrap} edges={['bottom']}>
        <View style={styles.sheet}>
          <View style={styles.grabber} />
          {title ? (
            <Text variant="h3" style={{ marginBottom: spacing.md }}>
              {title}
            </Text>
          ) : null}
          {children}
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: { ...StyleSheet.absoluteFillObject, backgroundColor: colors.overlay },
  sheetWrap: { marginTop: 'auto' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    padding: spacing.lg,
    paddingTop: spacing.sm,
    maxHeight: '80%',
  },
  grabber: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
});
