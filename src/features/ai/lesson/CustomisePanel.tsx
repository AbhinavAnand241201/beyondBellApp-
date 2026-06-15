import { useState } from 'react';
import { View } from 'react-native';

import { Banner, BottomSheet, Button, OptionChip, Text, TextField } from '@/components/ui';
import { isApiConfigured } from '@/lib/api';
import { colors, spacing } from '@/theme/tokens';
import { SECTION_LABELS, type CustomisableSection } from './types';

const SECTIONS = Object.keys(SECTION_LABELS) as CustomisableSection[];

const SUGGESTIONS = [
  'Make the hook more hands-on',
  'Add a real-world example',
  'Simplify the language',
  'Make it more challenging',
];

export interface CustomisePanelProps {
  visible: boolean;
  onClose: () => void;
  onApply: (section: CustomisableSection, instruction: string) => void;
  applying?: boolean;
}

/**
 * Customise-with-AI sheet (§2.3 "Customise mode", §3.5). The teacher picks one
 * section and types an instruction; the agent edits only that section. UI is fully
 * wired — it calls `onApply`, which hits the section endpoint when the backend is
 * connected.
 */
export function CustomisePanel({ visible, onClose, onApply, applying }: CustomisePanelProps) {
  const [section, setSection] = useState<CustomisableSection>('hook');
  const [instruction, setInstruction] = useState('');

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Customise with AI">
      <View style={{ gap: spacing.lg }}>
        {!isApiConfigured ? (
          <Banner
            tone="info"
            title="Preview mode"
            message="Connect the AI backend to apply edits. The flow below is fully wired."
          />
        ) : null}

        <View style={{ gap: spacing.sm }}>
          <Text variant="label">Which section?</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
            {SECTIONS.map((s) => (
              <OptionChip key={s} label={SECTION_LABELS[s]} selected={section === s} onPress={() => setSection(s)} />
            ))}
          </View>
        </View>

        <View style={{ gap: spacing.sm }}>
          <TextField
            label="What should change?"
            value={instruction}
            onChangeText={setInstruction}
            placeholder="e.g. Make the hook a quick group game"
            multiline
            numberOfLines={3}
            style={{ minHeight: 80, textAlignVertical: 'top' }}
          />
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
            {SUGGESTIONS.map((s) => (
              <OptionChip key={s} label={s} selected={false} onPress={() => setInstruction(s)} />
            ))}
          </View>
        </View>

        <Button
          title="Apply change"
          loading={applying}
          disabled={instruction.trim().length === 0}
          onPress={() => onApply(section, instruction.trim())}
          fullWidth
        />
        <Text variant="caption" color={colors.muted} style={{ textAlign: 'center' }}>
          Only the selected section is updated — the rest of your plan stays intact.
        </Text>
      </View>
    </BottomSheet>
  );
}
