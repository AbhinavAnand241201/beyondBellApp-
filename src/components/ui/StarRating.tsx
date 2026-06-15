import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors } from '@/theme/tokens';

export interface StarRatingProps {
  value: number; // 0–5
  onChange?: (v: number) => void; // omit for read-only
  size?: number;
}

/** 1–5 star rating. Read-only when `onChange` is omitted. */
export function StarRating({ value, onChange, size = 24 }: StarRatingProps) {
  return (
    <View style={{ flexDirection: 'row', gap: 4 }}>
      {[1, 2, 3, 4, 5].map((i) => {
        const filled = i <= Math.round(value);
        const star = <Ionicons name={filled ? 'star' : 'star-outline'} size={size} color={colors.amber} />;
        if (!onChange) return <View key={i}>{star}</View>;
        return (
          <Pressable key={i} onPress={() => onChange(i)} hitSlop={4} accessibilityLabel={`${i} star`}>
            {star}
          </Pressable>
        );
      })}
    </View>
  );
}
