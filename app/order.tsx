import { router, useLocalSearchParams } from 'expo-router';
import { Linking, StyleSheet, Text, Pressable, View } from 'react-native';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export default function OrderScreen() {
  const params = useLocalSearchParams<{ orderId?: string; status?: string }>();
  const orderId = typeof params.orderId === 'string' ? params.orderId : '';
  const [status, setStatus] = useState(typeof params.status === 'string' ? params.status : 'awaiting_payment');
  const [amount, setAmount] = useState<number | null>(null);
  const [checkoutUrl, setCheckoutUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase || !orderId) return;
    supabase.from('orders').select('amount,status').eq('id', orderId).single().then(({ data }) => {
      if (data) {
        setAmount(data.amount === null ? null : Number(data.amount));
        setStatus(data.status);
      }
    });
  }, [orderId]);

  async function startPayment() {
    if (!supabase || !orderId) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('hubtel-payment', {
        body: { action: 'initialize', orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      const url = data?.payment?.checkout_url;
      if (!url) throw new Error('Hubtel did not return a checkout URL.');
      setCheckoutUrl(url);
      await Linking.openURL(url);
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not start payment.');
    } finally {
      setBusy(false);
    }
  }

  async function dispatchDelivery() {
    if (!supabase || !orderId) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('dawurobo-create', {
        body: { orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.providerDeliveryId) {
        setStatus(data?.status ?? 'paid');
        setMessage('Payment confirmed. Your delivery has been sent to the logistics provider and is waiting for provider acceptance.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not dispatch the delivery.');
    } finally {
      setBusy(false);
    }
  }

  async function checkPayment() {
    if (!supabase || !orderId || busy) return;
    setBusy(true);
    setMessage('');
    try {
      const { data, error } = await supabase.functions.invoke('hubtel-payment', {
        body: { action: 'status', orderId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.payment?.status) setStatus(data.payment.status === 'paid' ? 'paid' : data.payment.status);
      if (data?.orderStatus) setStatus(data.orderStatus);
      if (data?.payment?.checkout_url) setCheckoutUrl(data.payment.checkout_url);
      if (data?.payment?.status === 'paid') {
        setStatus('paid');
        setMessage('Payment confirmed. Dispatching your delivery…');
        await dispatchDelivery();
      } else {
        setMessage('Payment is not confirmed yet.');
      }
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Could not check payment status.');
    } finally {
      setBusy(false);
    }
  }

  const canPay = status === 'awaiting_payment' && amount !== null && amount > 0;
  const paid = status === 'paid';

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.eyebrow}>JSI · Just Send It</Text>
        <Text style={styles.title}>Request created</Text>
        <Text style={styles.subtitle}>Your delivery request is now recorded in JSI.</Text>
        <View style={styles.card}>
          <Text style={styles.label}>Order ID</Text>
          <Text selectable style={styles.id}>{orderId || 'Unavailable'}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Amount</Text>
          <Text style={styles.amount}>{amount === null ? 'Waiting for delivery quote' : `GHS ${amount.toFixed(2)}`}</Text>
          <View style={styles.divider} />
          <Text style={styles.label}>Status</Text>
          <Text style={styles.status}>{status.replace(/_/g, ' ')}</Text>
        </View>

        {message ? <Text style={styles.message}>{message}</Text> : null}

        {canPay ? (
          <Pressable disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={startPayment}>
            <Text style={styles.buttonText}>{busy ? 'Opening payment…' : 'Pay with Hubtel'}</Text>
          </Pressable>
        ) : null}

        {paid ? (
          <Pressable disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={checkPayment}>
            <Text style={styles.buttonText}>{busy ? 'Checking…' : 'Check payment status'}</Text>
          </Pressable>
        ) : null}

        {status === 'paid' ? (
          <Pressable disabled={busy} style={[styles.button, busy && styles.disabled]} onPress={dispatchDelivery}>
            <Text style={styles.buttonText}>{busy ? 'Dispatching…' : 'Send to logistics provider'}</Text>
          </Pressable>
        ) : null}

        {status === 'awaiting_payment' && amount === null ? (
          <Text style={styles.note}>Payment is not available yet because JSI does not have a real delivery quote for this order. JSI will not invent a price.</Text>
        ) : (
          <Text style={styles.note}>Payment is handled by Hubtel. JSI records the payment state and only moves the order forward after confirmed payment.</Text>
        )}

        {checkoutUrl ? (
          <Pressable disabled={busy} style={styles.secondary} onPress={() => Linking.openURL(checkoutUrl)}>
            <Text style={styles.secondaryText}>Open Hubtel checkout again</Text>
          </Pressable>
        ) : null}

        <Pressable style={styles.secondary} onPress={() => router.replace('/')}>
          <Text style={styles.secondaryText}>Back to JSI</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', justifyContent: 'center', padding: 24 },
  content: { width: '100%', maxWidth: 620, alignSelf: 'center', gap: 18 },
  eyebrow: { fontSize: 13, fontWeight: '700', letterSpacing: 1.5 },
  title: { fontSize: 34, fontWeight: '800' },
  subtitle: { color: '#666', fontSize: 16, lineHeight: 24 },
  card: { borderWidth: 1, borderColor: '#ddd', borderRadius: 12, padding: 18, gap: 12 },
  label: { fontSize: 13, fontWeight: '700', color: '#666' },
  id: { fontSize: 15, lineHeight: 22 },
  amount: { fontSize: 20, fontWeight: '800' },
  status: { fontSize: 18, fontWeight: '700', textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: '#eee' },
  button: { backgroundColor: '#111', paddingVertical: 15, borderRadius: 10, alignItems: 'center' },
  disabled: { opacity: 0.4 },
  buttonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  secondary: { paddingVertical: 12, alignItems: 'center' },
  secondaryText: { fontWeight: '700' },
  note: { color: '#888', fontSize: 13, lineHeight: 20 },
  message: { color: '#555', fontSize: 14, lineHeight: 20 },
});
