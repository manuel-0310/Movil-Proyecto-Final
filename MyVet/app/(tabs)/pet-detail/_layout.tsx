// app/(tabs)/pet-detail/_layout.tsx
import { Stack } from "expo-router";

export default function PetDetailLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="[id]" />
    </Stack>
  );
}
