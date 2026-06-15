import { useEffect, useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Banner, BottomSheet, Button, OptionChip, Text, TextField } from '@/components/ui';
import { isApiConfigured } from '@/lib/api';
import { colors, spacing } from '@/theme/tokens';
import type { Question } from './types';

export interface QuestionEditSheetProps {
  visible: boolean;
  question: Question | null;
  onClose: () => void;
  /** Manual inline edits (§2.4 edit mode). */
  onSave: (updated: Question) => void;
  /** AI rephrase (§2.4) — screen calls the question endpoint and replaces the question. */
  onRephrase: (question: Question, instruction: string) => void;
  rephrasing?: boolean;
  /** Save to personal question bank — Pro feature (§5.2). */
  onSaveToBank: (question: Question) => void;
  canSaveToBank: boolean;
  savingToBank?: boolean;
}

const REPHRASE_SUGGESTIONS = ['Make it harder', 'Simplify the wording', 'Make it application-based', 'Add a real-world context'];

/** Edit one question by hand, or ask the AI to rephrase it (§2.4 edit mode). */
export function QuestionEditSheet({
  visible,
  question,
  onClose,
  onSave,
  onRephrase,
  rephrasing,
  onSaveToBank,
  canSaveToBank,
  savingToBank,
}: QuestionEditSheetProps) {
  const [draft, setDraft] = useState<Question | null>(question);
  const [instruction, setInstruction] = useState('');

  // Re-seed the local draft whenever a new question is opened.
  useEffect(() => {
    setDraft(question);
    setInstruction('');
  }, [question]);

  if (!draft) return null;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={`Edit ${draft.id}`}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <View style={{ gap: spacing.lg }}>
          <TextField
            label="Question"
            value={draft.question}
            onChangeText={(v) => setDraft({ ...draft, question: v })}
            multiline
            numberOfLines={3}
            style={{ minHeight: 84, textAlignVertical: 'top' }}
          />

          {draft.options ? (
            <View style={{ gap: spacing.sm }}>
              <Text variant="label">Options</Text>
              {draft.options.map((opt, i) => (
                <TextField
                  key={i}
                  value={opt}
                  onChangeText={(v) => {
                    const options = [...(draft.options ?? [])];
                    options[i] = v;
                    setDraft({ ...draft, options });
                  }}
                />
              ))}
            </View>
          ) : null}

          <TextField
            label="Answer"
            value={draft.answer}
            onChangeText={(v) => setDraft({ ...draft, answer: v })}
            multiline
            numberOfLines={3}
            style={{ minHeight: 84, textAlignVertical: 'top' }}
          />

          <Button title="Save changes" onPress={() => onSave(draft)} fullWidth />

          {/* Save to question bank (Pro, §5.2) */}
          <Button
            title={canSaveToBank ? 'Save to question bank' : 'Save to bank (Pro)'}
            variant="secondary"
            loading={savingToBank}
            disabled={!canSaveToBank}
            onPress={() => onSaveToBank(draft)}
            leftIcon={<Ionicons name="albums-outline" size={16} color={colors.ink} />}
            fullWidth
          />

          {/* AI rephrase */}
          <View style={{ gap: spacing.sm, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing.lg }}>
            <Text variant="label">Rephrase with AI</Text>
            {!isApiConfigured ? (
              <Banner tone="info" title="Preview mode" message="Connect the AI backend to apply rephrasing." />
            ) : null}
            <TextField
              value={instruction}
              onChangeText={setInstruction}
              placeholder="e.g. Make it a case-study question"
            />
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs }}>
              {REPHRASE_SUGGESTIONS.map((s) => (
                <OptionChip key={s} label={s} selected={false} onPress={() => setInstruction(s)} />
              ))}
            </View>
            <Button
              title="Rephrase"
              variant="secondary"
              loading={rephrasing}
              disabled={instruction.trim().length === 0}
              onPress={() => onRephrase(draft, instruction.trim())}
              fullWidth
            />
          </View>
        </View>
      </ScrollView>
    </BottomSheet>
  );
}
