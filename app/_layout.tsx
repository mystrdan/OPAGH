import { Stack } from 'expo-router';

export default function RootLayout() {
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
