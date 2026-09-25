import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

export default function VerifyScreen() {
  const params = useLocalSearchParams<{ phone?: string; channel?: string }>();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const phone = typeof params.phone === 'string' ? params.phone : '';
  const channel = params.channel === 'whatsapp' ? 'WhatsApp' : 'SMS';
  const canVerify = /^\d{6}$/.test(code) && !!phone;

  async function verify() {
    if (!canVerify || busy) return;
    setError('');

    if (!supabase) {
      setError('JSI is not connected to its authentication service yet.');
      return;
    }

    setBusy(true);
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: 'sms',
    });

    if (verifyError) {
      setBusy(false);
      setError(verifyError.message);
      return;
    }

    if (data.user) {
      const { error: profileError } = await supabase.from('profiles').upsert(
        { id: data.user.id, phone: data.user.phone ?? phone },
        { onConflict: 'id' }
      );

      if (profileError) {
        setBusy(false);
        setError(profileError.message);
        return;
      }
    }

    setBusy(false);
    router.replace('/');
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Enter your code</Text>
        <Text style={styles.subtitle}>We sent a 6-digit verification code to {phone || 'your phone number'} via {channel}.</Text>

        <View style={styles.field}>
          <Text style={styles.label}>6-digit code</Text>
          <TextInput
            value={code}
            onChangeText={(value) => setCode(value.replace(/\D/g, '').slice(0, 6))}
            placeholder="000000"
            keyboardType="number-pad"
            maxLength={6}
            style={styles.input}
            editable={!busy}
            autoFocus
          />
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable disabled={!canVerify || busy} onPress={verify} style={[styles.button, (!canVerify || busy) && styles.disabled]}>
          <Text style={styles.buttonText}>{busy ? 'Verifying…' : 'Verify'}</Text>
        </Pressable>

        <Text style={styles.note}>The code is verified by Supabase Auth. JSI does not accept or simulate verification locally.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 520, alignSelf: 'center', gap: 18 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  field: { gap: 8, marginTop: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 20, letterSpacing: 5 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13, lineHeight: 19 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 20 }
});
