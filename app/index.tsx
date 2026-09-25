import { Link } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI</Text>
        <Text style={styles.title}>Just Send It.</Text>
        <Text style={styles.subtitle}>
          Send a package or have one picked up through connected delivery providers.
        </Text>
        <Link href="/login" style={styles.secondary}>Log in</Link>
        <Link href="/request" style={styles.button}>Start a request</Link>
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
  secondary: { alignSelf: 'flex-start', color: '#111', paddingHorizontal: 20, paddingVertical: 14, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, fontSize: 16, fontWeight: '700', overflow: 'hidden' },
  button: { alignSelf: 'flex-start', backgroundColor: '#111', color: '#fff', paddingHorizontal: 20, paddingVertical: 14, borderRadius: 10, fontSize: 16, fontWeight: '700', overflow: 'hidden' },
  note: { fontSize: 13, color: '#888' }
});
