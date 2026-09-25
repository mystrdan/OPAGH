import MapView, { Marker } from 'react-native-maps';
import { Platform, StyleSheet, Text, View } from 'react-native';
import type { TrackingPoint } from '../lib/logistics';

type Props = { point: TrackingPoint | null; label?: string };

export default function TrackingMap({ point, label = 'Package / rider' }: Props) {
  if (Platform.OS === 'web') {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Live map</Text>
        <Text style={styles.fallbackText}>
          {point ? `${label}: ${point.latitude.toFixed(5)}, ${point.longitude.toFixed(5)}` : 'Waiting for the logistics provider to send a live location.'}
        </Text>
      </View>
    );
  }

  if (!point) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Live map</Text>
        <Text style={styles.fallbackText}>Waiting for the logistics provider to send a live location.</Text>
      </View>
    );
  }

  return (
    <MapView style={styles.map} region={{
      latitude: point.latitude,
      longitude: point.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    }}>
      <Marker coordinate={{ latitude: point.latitude, longitude: point.longitude }} title={label} />
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: { width: '100%', height: 320, borderRadius: 14 },
  fallback: { height: 320, borderRadius: 14, borderWidth: 1, borderColor: '#ddd', backgroundColor: '#f7f7f7', justifyContent: 'center', alignItems: 'center', padding: 24, gap: 8 },
  fallbackTitle: { fontSize: 18, fontWeight: '800' },
  fallbackText: { color: '#666', textAlign: 'center', lineHeight: 21 },
});