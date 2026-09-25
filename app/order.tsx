import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, Pressable, View } from 'react-native';

export default function OrderScreen() {
  const params = useLocalSearchParams<{ orderId?: string; status?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const status = typeof params.status === 'string' ? params.status : 'awaiting_payment';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Request created</Text>
        <Text style={styles.subtitle}>Your delivery request is now recorded in JSI.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Order ID</Text>
          <Text selectable style={styles.id}>{orderId || 'Unavailable'}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>{status.replace(/_/g, ' ')}</Text>
        </View>
        <Text style={styles.note}>No payment has been taken and no provider has been dispatched yet. The next step is payment integration.</Text>
        <Pressable style={styles.button} onPress={() => router.replace('/')}>
          <Text style={styles.buttonText}>Back to JSI</Text>
        </Pressable>
      </View>
    </View>
  );
}
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: 18 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#666' },
  id: { fontSize: 15, lineHeight: 22 },
  status: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#eee' },
  note: { color: '#888', fontSize: 13, lineHeight: 20 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
