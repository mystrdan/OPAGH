import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    mode?: 'send' | 'pick';
    pickupAddress?: string; pickupDigitalAddress?: string; pickupLandmark?: string;
    destinationAddress?: string; destinationDigitalAddress?: string; destinationLandmark?: string;
    item?: string; providerId?: string; quoteId?: string; quoteAmount?: string; quoteCurrency?: string;
  }>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const mode = params.mode === 'pick' ? 'pick' : 'send';

  async function createRequest() {
    if (busy) return;
    setError('');

    if (!supabase) {
      setError('JSI is not connected to its database.');
      return;
    }

    setBusy(true);

    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      if (authError || !authData.user) throw new Error('Your session has expired. Please log in again.');

      const userId = authData.user.id;

      const { data: pickup, error: pickupError } = await supabase.from('addresses').insert({
        user_id: userId,
        address: params.pickupAddress?.trim() || '',
        digital_address: params.pickupDigitalAddress?.trim() || null,
        landmark: params.pickupLandmark?.trim() || null,
        latitude: Number(params.pickupLatitude), longitude: Number(params.pickupLongitude),
      }).select('id').single();
      if (pickupError) throw pickupError;

      const { data: destination, error: destinationError } = await supabase.from('addresses').insert({
        user_id: userId,
        address: params.destinationAddress?.trim() || '',
        digital_address: params.destinationDigitalAddress?.trim() || null,
        landmark: params.destinationLandmark?.trim() || null,
        latitude: Number(params.destinationLatitude), longitude: Number(params.destinationLongitude),
      }).select('id').single();
      if (destinationError) throw destinationError;

      const { data: order, error: orderError } = await supabase.from('orders').insert({
        user_id: userId,
        mode,
        pickup_address_id: pickup.id,
        destination_address_id: destination.id,
        item_description: params.item?.trim() || '',
        amount: Number(params.quoteAmount) > 0 ? Number(params.quoteAmount) : null,
        currency: params.quoteCurrency?.trim() || 'GHS',
        status: 'awaiting_payment',
      }).select('id, status').single();

      if (orderError) throw orderError;

      router.replace({ pathname: '/order', params: { orderId: order.id, status: order.status } });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create the delivery request.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Review request</Text>
        <Text style={styles.subtitle}>Check the pickup, destination and package before creating the delivery request.</Text>

        <View style={styles.card}>
          <Text style={styles.mode}>{mode === 'pick' ? 'Pick' : 'Send'}</Text>
          <Row label="Pickup" value={params.pickupAddress} />
          {params.pickupDigitalAddress ? <Row label="GhanaPostGPS" value={params.pickupDigitalAddress} /> : null}
          {params.pickupLandmark ? <Row label="Pickup directions" value={params.pickupLandmark} /> : null}
          <View style={styles.divider} />
          <Row label="Destination" value={params.destinationAddress} />
          {params.destinationDigitalAddress ? <Row label="GhanaPostGPS" value={params.destinationDigitalAddress} /> : null}
          {params.destinationLandmark ? <Row label="Destination directions" value={params.destinationLandmark} /> : null}
          <View style={styles.divider} />
          <Row label="Package" value={params.item} />
          <Row label="Provider option" value={params.providerId} />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={createRequest}>
          <Text style={styles.buttonText}>{busy ? 'Creating request…' : 'Create delivery request'}</Text>
        </Pressable>
        <Text style={styles.note}>This creates the JSI order as awaiting payment. Payment and provider dispatch remain separate steps.</Text>
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return <View style={styles.row}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || 'Not provided'}</Text>
  </View>;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', gap: 16, paddingVertical: 30 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, gap: 12 },
  mode: { fontSize: 18, fontWeight: '800' },
  row: { gap: 4 },
  label: { fontSize: 13, fontWeight: '700', color: '#666' },
  value: { fontSize: 16, lineHeight: 22 },
  divider: { height: 1, backgroundColor: '#eee' },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13, lineHeight: 19 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 20 },
});
