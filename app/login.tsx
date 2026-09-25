import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { supabase } from '../lib/supabase';

type OtpChannel = 'sms' | 'whatsapp' | 'telegram';

function normalizePhone(value: string) {
  const compact = value.trim().replace(/[^\d+]/g, '');
  if (/^0\d{9}$/.test(compact)) return `+233${compact.slice(1)}`;
  if (/^233\d{9}$/.test(compact)) return `+${compact}`;
  return compact;
}

function isGhanaMobile(phone: string) {
  return /^\+233[25]\d{8}$/.test(phone);
}

const channels: Array<{ id: OtpChannel; label: string; detail: string }> = [
  { id: 'sms', label: 'SMS', detail: 'Text message' },
  { id: 'whatsapp', label: 'WhatsApp', detail: 'WhatsApp message' },
  { id: 'telegram', label: 'Telegram', detail: 'Telegram message' },
];

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [channel, setChannel] = useState<OtpChannel>('sms');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const normalized = normalizePhone(phone);
  const canContinue = isGhanaMobile(normalized);

  async function continueToVerification() {
    if (!canContinue || busy) return;
    setError('');

    if (channel === 'telegram') {
      setError('Telegram verification is not configured for JSI yet. Choose SMS or WhatsApp.');
      return;
    }

    if (!supabase) {
      setError('JSI is not connected to its authentication service yet.');
      return;
    }

    setBusy(true);
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
      options: channel === 'whatsapp' ? { channel: 'whatsapp' } : undefined,
    });
    setBusy(false);

    if (otpError) {
      setError(otpError.message);
      return;
    }

    router.push({
      pathname: '/verify',
      params: { phone: normalized, channel },
    });
  }

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Log in</Text>
        <Text style={styles.subtitle}>Enter your phone number and choose where you want your verification code sent.</Text>

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

        <View style={styles.field}>
          <Text style={styles.label}>Send code via</Text>
          <View style={styles.channels}>
            {channels.map((item) => {
              const selected = channel === item.id;
              const unavailable = item.id === 'telegram';

              return (
                <Pressable
                  key={item.id}
                  disabled={busy}
                  onPress={() => {
                    setChannel(item.id);
                    setError('');
                  }}
                  style={[
                    styles.channel,
                    selected && styles.channelSelected,
                    unavailable && styles.channelUnavailable,
                  ]}
                >
                  <Text style={[styles.channelLabel, selected && styles.channelLabelSelected]}>
                    {item.label}
                  </Text>
                  <Text style={styles.channelDetail}>
                    {unavailable ? 'Not configured yet' : item.detail}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          disabled={!canContinue || busy}
          onPress={continueToVerification}
          style={[styles.button, (!canContinue || busy) && styles.disabled]}
        >
          <Text style={styles.buttonText}>{busy ? 'Sending code…' : 'Continue'}</Text>
        </Pressable>

        <Text style={styles.note}>
          JSI only accepts valid Ghanaian mobile numbers and uses the selected channel for the OTP.
        </Text>
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
  channels: { gap: 10 },
  channel: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 13 },
  channelSelected: { borderColor: '#111', backgroundColor: '#f5f5f5' },
  channelUnavailable: { opacity: 0.55 },
  channelLabel: { fontSize: 16, fontWeight: '700' },
  channelLabelSelected: { color: '#111' },
  channelDetail: { color: '#777', fontSize: 13, marginTop: 3 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  note: { color: '#888', fontSize: 13, lineHeight: 19 },
  error: { color: '#b42318', fontSize: 14, lineHeight: 20 }
});
