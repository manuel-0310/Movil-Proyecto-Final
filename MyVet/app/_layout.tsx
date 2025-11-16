// app/_layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <OnboardingProvider>
      <AuthProvider>
        <Slot />
      </AuthProvider>
    </OnboardingProvider>
  );
}