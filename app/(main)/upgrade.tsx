import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { Banner, Button, Card, Pill, Segmented, Text } from '@/components/ui';
import { useAuth } from '@/providers/AuthProvider';
import { useCurrentUser } from '@/features/user/useCurrentUser';
import { PLANS, annualSavingsPct, type Plan } from '@/features/billing/plans';
import { analytics } from '@/lib/analytics';
import { isApiConfigured } from '@/lib/api';
import { colors, spacing } from '@/theme/tokens';

type Cycle = 'monthly' | 'annual';

export default function UpgradeScreen() {
  const { user } = useAuth();
  const me = useCurrentUser(user?.id);
  const tier = me.data?.tier ?? 'free';
  const isFounding = me.data?.isFoundingMember ?? false;
  const [cycle, setCycle] = useState<Cycle>('annual');

  function subscribe(plan: Plan) {
    analytics.track('upgrade_started', { plan: plan.tier, cycle });
    if (!isApiConfigured) {
      Alert.alert('Connect a payment gateway', 'Checkout (Razorpay) runs server-side; wire EXPO_PUBLIC_API_BASE_URL and the gateway to enable upgrades.');
      return;
    }
    // TODO: launch Razorpay/EasyPay checkout; on webhook success the tier updates server-side.
    Alert.alert('Checkout', `Starting ${plan.name} (${cycle}) checkout…`);
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <Stack.Screen options={{ headerShown: true, title: 'Upgrade', presentation: 'modal' }} />
      <ScrollView contentContainerStyle={{ padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl }}>
        <View style={{ gap: spacing.xs }}>
          <Text variant="h1">Do more with BeyondBell</Text>
          <Text variant="body" color={colors.muted}>
            You’re on the {tier[0].toUpperCase() + tier.slice(1)} plan.
          </Text>
        </View>

        {isFounding ? (
          <Banner tone="warning" title="Founding Member pricing" message="You qualify for Standard at ₹1,999/year — locked for life." />
        ) : null}

        <Segmented
          options={[
            { value: 'monthly', label: 'Monthly' },
            { value: 'annual', label: 'Annual — save' },
          ]}
          value={cycle}
          onChange={(v) => setCycle(v as Cycle)}
        />

        {PLANS.map((plan) => (
          <PlanCard key={plan.tier} plan={plan} cycle={cycle} isFounding={isFounding} current={tier === plan.tier} onSubscribe={() => subscribe(plan)} />
        ))}

        <Text variant="caption" color={colors.mutedLight} style={{ textAlign: 'center' }}>
          Prices in ₹. Cancel anytime. Tier updates instantly after payment.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function PlanCard({ plan, cycle, isFounding, current, onSubscribe }: { plan: Plan; cycle: Cycle; isFounding: boolean; current: boolean; onSubscribe: () => void }) {
  const annual = isFounding && plan.foundingAnnual ? plan.foundingAnnual : plan.annual;
  const price = cycle === 'monthly' ? `₹${plan.monthly}/mo` : `₹${annual}/yr`;
  const savings = annualSavingsPct(plan);
  return (
    <Card highlight={plan.tier === 'pro'}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
        <Text variant="h2" color={plan.tier === 'pro' ? colors.ink : colors.ink}>
          {plan.name}
        </Text>
        {current ? <Pill label="Current" tone="success" /> : null}
        {cycle === 'annual' && savings > 0 ? <Pill label={`Save ${savings}%`} tone="amber" /> : null}
      </View>
      <Text variant="caption" color={colors.ink}>
        {plan.highlight}
      </Text>
      <Text variant="display" color={colors.ink} style={{ marginVertical: spacing.xs }}>
        {price}
      </Text>
      <View style={{ gap: spacing.xs, marginVertical: spacing.sm }}>
        {plan.features.map((f) => (
          <View key={f} style={{ flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' }}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} style={{ marginTop: 2 }} />
            <Text variant="body" color={colors.ink} style={{ flex: 1 }}>
              {f}
            </Text>
          </View>
        ))}
      </View>
      <Button title={current ? 'Your plan' : `Choose ${plan.name}`} disabled={current} onPress={onSubscribe} fullWidth variant={plan.tier === 'pro' ? 'primary' : 'secondary'} />
    </Card>
  );
}

const styles = StyleSheet.create({ safe: { flex: 1, backgroundColor: colors.canvas } });
