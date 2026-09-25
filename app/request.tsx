import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DeliveryMode } from '../lib/logistics';

export default function RequestScreen() {
  const [mode, setMode] = useState<DeliveryMode>('send');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDigitalAddress, setPickupDigitalAddress] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationDigitalAddress, setDestinationDigitalAddress] = useState('');
  const [destinationLandmark, setDestinationLandmark] = useState('');
  const [item, setItem] = useState('');

  const canContinue = Boolean(pickupAddress.trim() && destinationAddress.trim() && item.trim());

  function continueToOptions() {
    if (!canContinue) return;
    router.push({ pathname: '/options', params: {
      mode, pickupAddress, pickupDigitalAddress, pickupLandmark,
      destinationAddress, destinationDigitalAddress, destinationLandmark, item,
    }});
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>What do you want to do?</Text>
        <Text style={styles.subtitle}>Send a package or have a package picked up and brought to you.</Text>

        <View style={styles.modeRow}>
          <ModeButton label="Send" active={mode === 'send'} onPress={() => setMode('send')} />
          <ModeButton label="Pick" active={mode === 'pick'} onPress={() => setMode('pick')} />
        </View>

        <AddressSection title="Pickup address" address={pickupAddress} setAddress={setPickupAddress}
          digitalAddress={pickupDigitalAddress} setDigitalAddress={setPickupDigitalAddress}
          landmark={pickupLandmark} setLandmark={setPickupLandmark}
          hint={mode === 'pick' ? 'Where should the package be picked up?' : 'Where is the package starting from?'} />

        <AddressSection title="Destination address" address={destinationAddress} setAddress={setDestinationAddress}
          digitalAddress={destinationDigitalAddress} setDigitalAddress={setDestinationDigitalAddress}
          landmark={destinationLandmark} setLandmark={setDestinationLandmark}
          hint={mode === 'pick' ? 'Where should the package be brought to you?' : 'Where should the package be delivered?'} />

        <View style={styles.field}>
          <Text style={styles.label}>What are you moving?</Text>
          <TextInput value={item} onChangeText={setItem} placeholder="e.g. documents, food, cartons" style={styles.input} />
        </View>

        <Pressable disabled={!canContinue} onPress={continueToOptions} style={[styles.button, !canContinue && styles.disabled]}>
          <Text style={styles.buttonText}>Find delivery options</Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
    <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
  </Pressable>;
}

function AddressSection({ title, address, setAddress, digitalAddress, setDigitalAddress, landmark, setLandmark, hint }: {
  title: string; address: string; setAddress: (v: string) => void;
  digitalAddress: string; setDigitalAddress: (v: string) => void;
  landmark: string; setLandmark: (v: string) => void; hint: string;
}) {
  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.hint}>{hint}</Text>
    <TextInput value={address} onChangeText={setAddress} placeholder="Street, area or full address" style={styles.input} />
    <TextInput value={digitalAddress} onChangeText={setDigitalAddress} placeholder="GhanaPostGPS address (optional)" style={styles.input} autoCapitalize="characters" />
    <TextInput value={landmark} onChangeText={setLandmark} placeholder="Landmark or extra directions (optional)" style={styles.input} />
  </View>;
}

const styles = StyleSheet.create({
  container: { padding: 24, backgroundColor: '#fff', flexGrow: 1 },
  content: { width: '100%', maxWidth: 650, alignSelf: 'center', gap: 18, paddingVertical: 30 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  modeRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  modeButton: { flex: 1, borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  modeButtonActive: { backgroundColor: '#111', borderColor: '#111' },
  modeText: { fontSize: 16, fontWeight: '700', color: '#111' },
  modeTextActive: { color: '#fff' },
  section: { gap: 8, paddingTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '800' },
  hint: { color: '#666', fontSize: 14, lineHeight: 20 },
  field: { gap: 8 },
  label: { fontSize: 14, fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 16, backgroundColor: '#fff' },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
