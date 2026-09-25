import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[\s()-]/g, '');
  if (/^0\d{9}$/.test(compact)) return `+233${compact.slice(1)}`;
  if (/^233\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizePhone(phone);
  const canContinue = /^\+[1-9]\d{7,14}$/.test(normalized);

  async function continueToVerification() {
    if (!canContinue || busy) return;
    setError('');

    if (!supabase) {
      setError('JSI is not connected to its authentication service yet.');
      return;
    }

    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });
    setBusy(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    router.push({ pathname: '/verify', params: { phone: normalized } });
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
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
            editable={!busy}
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={!canContinue || busy} onPress={continueToVerification} style={[styles.button, (!canContinue || busy) && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? 'Sending code…' : 'Continue'}</Text>
        </Pressable>

        <Text style={styles.note}>Your code is sent through the phone authentication provider configured for JSI.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 36, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  field: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 17 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13, lineHeight: 19 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 20 }
});
