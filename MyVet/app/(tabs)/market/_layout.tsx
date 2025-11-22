// app/(tabs)/market/_layout.tsx
import { Stack } from 'expo-router';

export default function MarketLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
    </Stack>
  );
}