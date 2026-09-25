import { StyleSheet, Text, View } from 'react-native';

export default function CheckoutScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Checkout</Text>
        <Text style={styles.subtitle}>Payment integration will be connected after the logistics provider flow is verified.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24, justifyContent: 'center' },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 12 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 }
});
