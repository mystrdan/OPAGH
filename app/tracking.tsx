import { useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import TrackingMap from '../components/TrackingMap';
import type { TrackingPoint } from '../lib/logistics';
import { supabase } from '../lib/supabase';

type TrackingRow = {
  status: string;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  heading: number | null;
  speed: number | null;
  recorded_at: string;
};

export default function TrackingScreen() {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [status, setStatus] = useState('Waiting for tracking');
  const [point, setPoint] = useState<TrackingPoint | null>(null);
  const [loading, setLoading] = useState(Boolean(orderId));

  useEffect(() => {
    if (!orderId || !supabase) {
      setLoading(false);
      return;
    }

    let mounted = true;

    const applyTracking = (data: TrackingRow) => {
      setStatus(data.status);
      if (data.latitude !== null && data.longitude !== null) {
        setPoint({
          latitude: data.latitude,
          longitude: data.longitude,
          accuracy: data.accuracy,
          heading: data.heading,
          speed: data.speed,
          recordedAt: data.recorded_at,
        });
      }
    };

    const load = async () => {
      const { data } = await supabase
        .from('tracking_locations')
        .select('status, latitude, longitude, accuracy, heading, speed, recorded_at')
        .eq('order_id', orderId)
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!mounted) return;
      if (data) applyTracking(data as TrackingRow);
      setLoading(false);
    };

    void load();

    const channel = supabase.channel(`order-tracking-${orderId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'tracking_locations',
        filter: `order_id=eq.${orderId}`,
      }, (payload) => applyTracking(payload.new as TrackingRow))
      .subscribe();

    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, [orderId]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Track delivery</Text>
        <Text style={styles.subtitle}>See the latest location supplied by the connected logistics provider.</Text>

        <View style={styles.statusCard}>
          <Text style={styles.statusLabel}>Status</Text>
          <Text style={styles.status}>{status}</Text>
          {point ? <Text style={styles.updated}>Last location: {new Date(point.recordedAt).toLocaleString()}</Text> : null}
        </View>

        {loading ? <ActivityIndicator /> : <TrackingMap point={point} label="Package / rider" />}

        {!point && !loading ? (
          <Text style={styles.note}>
            A map marker will appear when the provider supplies a current GPS location. JSI does not invent or simulate a rider location.
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 24 },
  content: { width: '100%', maxWidth: 700, alignSelf: 'center', gap: 16, paddingVertical: 30 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 32, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  statusCard: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, gap: 6 },
  statusLabel: { color: '#666', fontSize: 13, fontWeight: '700' },
  status: { fontSize: 20, fontWeight: '800' },
  updated: { color: '#777', fontSize: 13 },
  note: { color: '#777', fontSize: 13, lineHeight: 20 },
});