import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { mockProvider, type DeliveryQuote } from '../lib/logistics';

export default function OptionsScreen() {
  const params = useLocalSearchParams<{
    mode?: 'send' | 'pick';
    pickupAddress?: string; pickupDigitalAddress?: string; pickupLandmark?: string;
    destinationAddress?: string; destinationDigitalAddress?: string; destinationLandmark?: string;
    item?: string;
  }>();
  const [quotes, setQuotes] = useState<DeliveryQuote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    mockProvider.getQuote({
      mode: params.mode === 'pick' ? 'pick' : 'send',
      pickup: {
        address: params.pickupAddress ?? '',
        digitalAddress: params.pickupDigitalAddress ?? '',
        landmark: params.pickupLandmark ?? '',
      },
      destination: {
        address: params.destinationAddress ?? '',
        digitalAddress: params.destinationDigitalAddress ?? '',
        landmark: params.destinationLandmark ?? '',
      },
      item: params.item ?? '',
    }).then((result) => {
      if (active) { setQuotes(result); setLoading(false); }
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [params.mode, params.pickupAddress, params.pickupDigitalAddress, params.pickupLandmark,
      params.destinationAddress, params.destinationDigitalAddress, params.destinationLandmark, params.item]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Delivery options</Text>
        <Text style={styles.subtitle}>Available options returned by connected logistics providers.</Text>
        {loading ? <ActivityIndicator /> : quotes.length === 0 ? (
          <Text style={styles.empty}>No delivery options are available.</Text>
        ) : quotes.map((quote) => (
          <View key={quote.id} style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.name}>{quote.serviceName}</Text>
              <Text style={styles.provider}>{quote.providerName}</Text>
              <Text style={styles.price}>{quote.amount === null ? 'Quote required' : `${quote.currency} ${quote.amount.toFixed(2)}`}</Text>
            </View>
            <Pressable style={styles.select} onPress={() => router.push({ pathname: '/checkout', params: {
              quoteId: quote.id, providerId: quote.providerId,
              mode: params.mode, pickupAddress: params.pickupAddress,
              pickupDigitalAddress: params.pickupDigitalAddress, pickupLandmark: params.pickupLandmark,
              destinationAddress: params.destinationAddress,
              destinationDigitalAddress: params.destinationDigitalAddress,
              destinationLandmark: params.destinationLandmark, item: params.item,
            }})}>
              <Text style={styles.selectText}>Select</Text>
            </Pressable>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', gap: 16, paddingVertical: 30 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 17, fontWeight: '700' },
  provider: { color: '#666' },
  price: { fontWeight: '700', marginTop: 4 },
  select: { backgroundColor: '#111', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 9 },
  selectText: { color: '#fff', fontWeight: '700' },
  empty: { color: '#666' },
});
