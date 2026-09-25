import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

export default function LoginScreen() {
  const [phone, setPhone] = useState('');

  const normalized = phone.trim();
  const canContinue = /^\+?[0-9]{9,15}$/.test(normalized);

  function continueToVerification() {
    if (!canContinue) return;
    router.push({ pathname: '/verify', params: { phone: normalized } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>OPAGH</Text>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>Enter your phone number. We’ll send you a one-time verification code.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            placeholder="+233..."
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            style={styles.input}
          />
        </View>

        <Pressable disabled={!canContinue} onPress={continueToVerification} style={[styles.button, !canContinue && styles.disabled]}>
          <Text style={styles.buttonText}>Continue</Text>
        </Pressable>
        <Text style={styles.note}>OTP delivery will be connected to Supabase Auth.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 2 },
  title: { fontSize: 36, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  field: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 17 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13 }
});
