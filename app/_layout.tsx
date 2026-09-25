import { Stack, usePathname, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

const protectedRoutes = new Set(['/request', '/options', '/checkout', '/tracking']);
const authRoutes = new Set(['/login', '/verify']);

export default function RootLayout() {
  const pathname = usePathname();
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(!supabase);

  useEffect(() => {
    if (!supabase) return;

    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setSession(data.session);
        setReady(true);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (mounted) setSession(nextSession);
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!ready) return;

    if (protectedRoutes.has(pathname) && !session) {
      router.replace({ pathname: '/login', params: { next: pathname } });
      return;
    }

    if (authRoutes.has(pathname) && session) {
      router.replace('/');
    }
  }, [pathname, ready, session, router]);

  if (!ready) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#fff' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'JSI' }} />
      <Stack.Screen name="login" options={{ title: 'Log in' }} />
      <Stack.Screen name="verify" options={{ title: 'Verify' }} />
      <Stack.Screen name="request" options={{ title: 'Send or Pick' }} />
      <Stack.Screen name="options" options={{ title: 'Delivery options' }} />
      <Stack.Screen name="checkout" options={{ title: 'Review request' }} />
      <Stack.Screen name="tracking" options={{ title: 'Track delivery' }} />
    </Stack>
  );
}
