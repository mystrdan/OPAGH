import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string }>();
  const [code, setCode] = useState('');

  const phone = typeof params.phone === 'string' ? params.phone : '';
  const canVerify = /^\d{6}$/.test(code);

  function verify() {
    if (!canVerify) return;
    // Supabase OTP verification will replace this transition once the backend is connected.
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>We’ll verify the code sent to {phone || 'your phone number'}.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
          />
        </View>

        <Pressable disabled={!canVerify} onPress={verify} style={[styles.button, !canVerify && styles.disabled]}>
          <Text style={styles.buttonText}>Verify</Text>
        </Pressable>
        <Text style={styles.note}>Live OTP verification will be enabled when the Supabase project is ready.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  field: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 20, letterSpacing: 5 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13 }
});
