import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

export default function CheckoutScreen() {
  const params = useLocalSearchParams<{
    mode?: 'send' | 'pick';
    pickupAddress?: string; pickupDigitalAddress?: string; pickupLandmark?: string;
    destinationAddress?: string; destinationDigitalAddress?: string; destinationLandmark?: string;
    item?: string; providerId?: string;
  }>();

  const mode = params.mode === 'pick' ? 'pick' : 'send';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Review request</Text>
        <Text style={styles.subtitle}>Check the pickup, destination and package before payment.</Text>

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
          <Row label="Provider" value={params.providerId} />
        </View>

        <Pressable style={styles.button} onPress={() => router.push('/')}>
          <Text style={styles.buttonText}>Continue to payment</Text>
        </Pressable>
        <Text style={styles.note}>Payment and delivery creation are not connected yet.</Text>
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
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13 },
});
