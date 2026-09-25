import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>OPAGH</Text>
        <Text style={styles.title}>Move it.</Text>
        <Text style={styles.subtitle}>
          One place to order logistics from connected delivery providers.
        </Text>
        <Link href="/request" style={styles.button}>Request a delivery</Link>
        <Text style={styles.note}>Web · Android · iOS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 560, gap: 18 },
  eyebrow: { fontSize: 14, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 48, fontWeight: '800', letterSpacing: -2 },
  subtitle: { fontSize: 18, lineHeight: 27, color: '#555', maxWidth: 480 },
  button: { alignSelf: 'flex-start', backgroundColor: '#111', color: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, fontSize: 16, fontWeight: '700', overflow: 'hidden' },
  note: { fontSize: 13, color: '#888' }
});
