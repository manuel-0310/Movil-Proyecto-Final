// app/_layout.tsx
import { AuthProvider } from "@/contexts/AuthContext";
import { OnboardingProvider } from "@/contexts/OnboardingContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { Slot } from "expo-router";

export default function RootLayout() {
  return (
    <ThemeProvider>
      <OnboardingProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </OnboardingProvider>
    </ThemeProvider>
  );
}