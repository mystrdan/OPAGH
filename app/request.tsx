import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function RequestScreen() {
  const [pickup, setPickup] = useState('');
  const [destination, setDestination] = useState('');
  const [item, setItem] = useState('');
  const canContinue = Boolean(pickup.trim() && destination.trim() && item.trim());

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Request a delivery</Text>
        <Text style={styles.subtitle}>Tell us where it starts, where it is going, and what needs to move.</Text>
        <Field label="Pickup" value={pickup} onChangeText={setPickup} placeholder="Pickup location" />
        <Field label="Destination" value={destination} onChangeText={setDestination} placeholder="Destination" />
        <Field label="What are you moving?" value={item} onChangeText={setItem} placeholder="e.g. documents, food, cartons" />
        <Pressable disabled={!canContinue} onPress={() => router.push('/options')} style={[styles.button, !canContinue && styles.disabled]}>
          <Text style={styles.buttonText}>Find delivery options</Text>
        </Pressable>
      </View>
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder }: { label: string; value: string; onChangeText: (value: string) => void; placeholder: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} style={styles.input} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  content: { width: '100%', maxWidth: 600, alignSelf: 'center', gap: 18, paddingVertical: 30 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24, marginBottom: 8 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});
