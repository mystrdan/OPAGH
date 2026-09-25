import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'OPAGH' }} />
      <Stack.Screen name="request" options={{ title: 'Request delivery' }} />
      <Stack.Screen name="options" options={{ title: 'Delivery options' }} />
      <Stack.Screen name="checkout" options={{ title: 'Checkout' }} />
    </Stack>
  );
}
