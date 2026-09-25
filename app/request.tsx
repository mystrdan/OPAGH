import { router } from 'expo-router';
import * as Location from 'expo-location';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { DeliveryMode } from '../lib/logistics';

export default function RequestScreen() {
  const [mode, setMode] = useState<DeliveryMode>('send');
  const [pickupAddress, setPickupAddress] = useState('');
  const [pickupDigitalAddress, setPickupDigitalAddress] = useState('');
  const [pickupLandmark, setPickupLandmark] = useState('');
  const [pickupLatitude, setPickupLatitude] = useState('');
  const [pickupLongitude, setPickupLongitude] = useState('');
  const [destinationAddress, setDestinationAddress] = useState('');
  const [destinationDigitalAddress, setDestinationDigitalAddress] = useState('');
  const [destinationLandmark, setDestinationLandmark] = useState('');
  const [destinationLatitude, setDestinationLatitude] = useState('');
  const [destinationLongitude, setDestinationLongitude] = useState('');
  const [item, setItem] = useState('');

  const canContinue = Boolean(
    pickupAddress.trim() &&
    destinationAddress.trim() &&
    item.trim() &&
    Number.isFinite(Number(pickupLatitude)) &&
    Number.isFinite(Number(pickupLongitude)) &&
    Number.isFinite(Number(destinationLatitude)) &&
    Number.isFinite(Number(destinationLongitude))
  );

  function continueToOptions() {
    if (!canContinue) return;
    router.push({ pathname: '/options', params: {
      mode, pickupAddress, pickupDigitalAddress, pickupLandmark, pickupLatitude, pickupLongitude,
      destinationAddress, destinationDigitalAddress, destinationLandmark, destinationLatitude, destinationLongitude, item,
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

        <AddressSection
          title="Pickup address"
          address={pickupAddress}
          setAddress={setPickupAddress}
          digitalAddress={pickupDigitalAddress}
          setDigitalAddress={setPickupDigitalAddress}
          landmark={pickupLandmark}
          setLandmark={setPickupLandmark}
          latitude={pickupLatitude}
          setLatitude={setPickupLatitude}
          longitude={pickupLongitude}
          setLongitude={setPickupLongitude}
          hint={mode === 'pick' ? 'Where should the package be picked up?' : 'Where is the package starting from?'}
          currentLocationLabel="Use my current location"
        />

        <AddressSection
          title="Destination address"
          address={destinationAddress}
          setAddress={setDestinationAddress}
          digitalAddress={destinationDigitalAddress}
          setDigitalAddress={setDestinationDigitalAddress}
          landmark={destinationLandmark}
          setLandmark={setDestinationLandmark}
          latitude={destinationLatitude}
          setLatitude={setDestinationLatitude}
          longitude={destinationLongitude}
          setLongitude={setDestinationLongitude}
          hint={mode === 'pick' ? 'Where should the package be brought to you?' : 'Where should the package be delivered?'}
          currentLocationLabel="Use my current location"
        />

        <View style={styles.field}>
          <Text style={styles.label}>What are you moving?</Text>
          <TextInput value={item} onChangeText={setItem} placeholder="e.g. documents, food, cartons" style={styles.input} />
        </View>

        <Pressable disabled={!canContinue} onPress={continueToOptions} style={[styles.button, !canContinue && styles.disabled]}>
          <Text style={styles.buttonText}>Find delivery options</Text>
        </Pressable>
        {!canContinue ? (
          <Text style={styles.required}>Enter both addresses and set a location for both pickup and destination. You can use your current location or find coordinates from the address.</Text>
        ) : null}
      </View>
    </ScrollView>
  );
}

function ModeButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={[styles.modeButton, active && styles.modeButtonActive]}>
    <Text style={[styles.modeText, active && styles.modeTextActive]}>{label}</Text>
  </Pressable>;
}

function AddressSection({
  title, address, setAddress, digitalAddress, setDigitalAddress, landmark, setLandmark,
  latitude, setLatitude, longitude, setLongitude, hint, currentLocationLabel,
}: {
  title: string; address: string; setAddress: (v: string) => void;
  digitalAddress: string; setDigitalAddress: (v: string) => void;
  landmark: string; setLandmark: (v: string) => void;
  latitude: string; setLatitude: (v: string) => void;
  longitude: string; setLongitude: (v: string) => void;
  hint: string; currentLocationLabel: string;
}) {
  const [busy, setBusy] = useState(false);
  const [locationMessage, setLocationMessage] = useState('');

  async function useCurrentLocation() {
    setBusy(true);
    setLocationMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Location permission was not granted.');
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      setLatitude(String(current.coords.latitude));
      setLongitude(String(current.coords.longitude));

      // Keep the user's manually entered address/digital address intact.
      setLocationMessage('Current device location set.');
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : 'Could not get your current location.');
    } finally {
      setBusy(false);
    }
  }

  async function findAddressLocation() {
    const query = [address.trim(), digitalAddress.trim(), landmark.trim()].filter(Boolean).join(', ');
    if (!query) {
      setLocationMessage('Enter an address first.');
      return;
    }

    setBusy(true);
    setLocationMessage('');
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Location permission was not granted.');
      }

      const results = await Location.geocodeAsync(query);
      const first = results[0];
      if (!first) {
        throw new Error('No location was found for this address. Add more address detail or use the map/location option.');
      }

      setLatitude(String(first.latitude));
      setLongitude(String(first.longitude));
      setLocationMessage('Location found from the address. Check the address before continuing.');
    } catch (error) {
      setLocationMessage(error instanceof Error ? error.message : 'Could not find this address.');
    } finally {
      setBusy(false);
    }
  }

  return <View style={styles.section}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.hint}>{hint}</Text>
    <TextInput value={address} onChangeText={setAddress} placeholder="Street, area or full address" style={styles.input} />
    <TextInput value={digitalAddress} onChangeText={setDigitalAddress} placeholder="GhanaPostGPS address (optional)" style={styles.input} autoCapitalize="characters" />
    <TextInput value={landmark} onChangeText={setLandmark} placeholder="Landmark or extra directions (optional)" style={styles.input} />

    <View style={styles.locationActions}>
      <Pressable disabled={busy} onPress={useCurrentLocation} style={[styles.locationButton, busy && styles.disabled]}>
        {busy ? <ActivityIndicator /> : null}
        <Text style={styles.locationButtonText}>{currentLocationLabel}</Text>
      </Pressable>
      <Pressable disabled={busy} onPress={findAddressLocation} style={[styles.locationButton, busy && styles.disabled]}>
        <Text style={styles.locationButtonText}>Find from address</Text>
      </Pressable>
    </View>

    <View style={styles.coordinateRow}>
      <TextInput value={latitude} onChangeText={setLatitude} placeholder="Latitude" keyboardType="decimal-pad" style={[styles.input, styles.coordinate]} />
      <TextInput value={longitude} onChangeText={setLongitude} placeholder="Longitude" keyboardType="decimal-pad" style={[styles.input, styles.coordinate]} />
    </View>
    {locationMessage ? <Text style={styles.locationMessage}>{locationMessage}</Text> : null}
    <Text style={styles.coordinateHint}>Coordinates are used for provider pricing and dispatch. JSI only sends coordinates obtained from the device, address geocoder, or another verified location source.</Text>
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
  locationActions: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  locationButton: { borderWidth: 1, borderColor: '#ccc', borderRadius: 9, paddingVertical: 11, paddingHorizontal: 13, flexDirection: 'row', gap: 7, alignItems: 'center' },
  locationButtonText: { fontWeight: '700', fontSize: 14 },
  coordinateRow: { flexDirection: 'row', gap: 8 },
  coordinate: { flex: 1 },
  locationMessage: { color: '#555', fontSize: 12, lineHeight: 18 },
  coordinateHint: { color: '#888', fontSize: 12, lineHeight: 18 },
  required: { color: '#777', fontSize: 12, lineHeight: 18 },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center', marginTop: 4 },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});
