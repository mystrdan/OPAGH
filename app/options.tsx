import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

const options = [
  { id: 'standard', name: 'Standard delivery', provider: 'Connected provider', price: 'Quote required' },
  { id: 'economy', name: 'Economy delivery', provider: 'Connected provider', price: 'Quote required' }
];

export default function OptionsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Delivery options</Text>
        <Text style={styles.subtitle}>Provider results will appear here once the first logistics adapter is connected.</Text>
        {options.map((option) => (
          <View key={option.id} style={styles.card}>
            <View style={styles.info}>
              <Text style={styles.name}>{option.name}</Text>
              <Text style={styles.provider}>{option.provider}</Text>
              <Text style={styles.price}>{option.price}</Text>
            </View>
            <Pressable style={styles.select} onPress={() => router.push('/checkout')}>
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
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24, marginBottom: 8 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 16 },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 17, fontWeight: '700' },
  provider: { color: '#666' },
  price: { fontWeight: '700', marginTop: 4 },
  select: { backgroundColor: '#111', paddingHorizontal: 18, paddingVertical: 11, borderRadius: 9 },
  selectText: { color: '#fff', fontWeight: '700' }
});
