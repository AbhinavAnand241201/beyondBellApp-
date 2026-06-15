import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Card, Pill, Text } from '@/components/ui';
import { colors, radius, spacing } from '@/theme/tokens';
import { CONFIDENCE_META, type ChatMessage, type PrincipalAnswer } from './types';

/** Renders one chat message — user bubble, pending indicator, or structured answer. */
export function ChatMessageView({ message }: { message: ChatMessage }) {
  if (message.role === 'user') {
    return (
      <View style={[styles.row, { justifyContent: 'flex-end' }]}>
        <View style={styles.userBubble}>
          <Text variant="body" color={colors.ink} style={{ lineHeight: 21 }}>
            {message.text}
          </Text>
        </View>
      </View>
    );
  }
  if (message.pending) {
    return (
      <View style={[styles.row, { justifyContent: 'flex-start' }]}>
        <View style={styles.pending}>
          <ActivityIndicator size="small" color={colors.amberDark} />
          <Text variant="caption" color={colors.muted}>
            Consulting the policy base…
          </Text>
        </View>
      </View>
    );
  }
  return <AnswerCard answer={message.answer} />;
}

function AnswerCard({ answer }: { answer: PrincipalAnswer }) {
  const conf = CONFIDENCE_META[answer.confidence];
  const escalate = answer.confidence === 'Escalate';
  return (
    <Card style={escalate ? styles.escalateCard : undefined}>
      <View style={styles.confRow}>
        <Pill label={conf.label} tone={conf.tone} />
      </View>

      <Part label="Direct answer" text={answer.directAnswer} strong />
      <Part label="Source / basis" text={answer.source} icon="document-text-outline" />
      <Part label="Recommended action" text={answer.recommendedAction} icon="arrow-forward-circle-outline" />

      {/* Caution / escalation — always present, highlighted when escalating */}
      <View style={[styles.caution, escalate && styles.cautionEscalate]}>
        <Ionicons name={escalate ? 'alert-circle' : 'warning-outline'} size={16} color={escalate ? colors.danger : '#7A5A00'} />
        <Text variant="caption" color={escalate ? colors.danger : '#7A5A00'} style={{ flex: 1, lineHeight: 18 }}>
          {answer.caution}
        </Text>
      </View>

      {/* Citations (§2.2 source basis) */}
      {answer.citations.length > 0 ? (
        <View style={styles.citations}>
          {answer.citations.map((c, i) => (
            <View key={i} style={styles.citation}>
              <Ionicons name="link-outline" size={13} color={colors.muted} />
              <Text variant="caption" color={colors.muted} style={{ flex: 1 }}>
                <Text variant="caption" color={colors.ink} style={{ fontWeight: '700' }}>
                  {c.label}
                </Text>{' '}
                — {c.reference}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <Text variant="caption" color={colors.mutedLight} style={{ marginTop: spacing.sm }}>
        {conf.note}
      </Text>
    </Card>
  );
}

function Part({ label, text, strong, icon }: { label: string; text: string; strong?: boolean; icon?: keyof typeof Ionicons.glyphMap }) {
  return (
    <View style={{ marginBottom: spacing.sm }}>
      <View style={styles.partLabel}>
        {icon ? <Ionicons name={icon} size={13} color={colors.amberDark} /> : null}
        <Text variant="caption" color={colors.amberDark} style={{ fontWeight: '700', letterSpacing: 0.3 }}>
          {label.toUpperCase()}
        </Text>
      </View>
      <Text variant={strong ? 'bodyMedium' : 'body'} style={{ lineHeight: 21 }}>
        {text}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', marginVertical: spacing.xs },
  userBubble: { maxWidth: '85%', backgroundColor: '#FCE8B8', borderRadius: radius.md, padding: spacing.md },
  pending: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderWidth: StyleSheet.hairlineWidth, borderColor: colors.border },
  escalateCard: { borderColor: colors.danger, borderWidth: 1 },
  confRow: { flexDirection: 'row', marginBottom: spacing.sm },
  partLabel: { flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 2 },
  caution: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start', backgroundColor: '#FFF6E5', borderRadius: radius.sm, padding: spacing.sm, marginTop: spacing.xs },
  cautionEscalate: { backgroundColor: '#FBE3E1' },
  citations: { gap: spacing.xs, marginTop: spacing.sm, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border, paddingTop: spacing.sm },
  citation: { flexDirection: 'row', gap: spacing.xs, alignItems: 'flex-start' },
});
