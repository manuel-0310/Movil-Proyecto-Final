// contexts/OnboardingContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface OnboardingContextType {
  hasSeenOnboarding: boolean;
  hasCreatedFirstPet: boolean;
  isFirstLogin: boolean;
  completeOnboarding: () => Promise<void>;
  completeFirstPetSetup: () => Promise<void>;
  markFirstLogin: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  isLoading: boolean;
}

const OnboardingContext = createContext<OnboardingContextType | undefined>(undefined);

const ONBOARDING_KEY = '@MyVet:hasSeenOnboarding';
const FIRST_PET_KEY = '@MyVet:hasCreatedFirstPet';
const FIRST_LOGIN_KEY = '@MyVet:isFirstLogin';

// ⚠️ ACTIVAR/DESACTIVAR MODO PRUEBA
const TEST_MODE = true;

export const OnboardingProvider = ({ children }: { children: ReactNode }) => {
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);
  const [hasCreatedFirstPet, setHasCreatedFirstPet] = useState(false);
  const [isFirstLogin, setIsFirstLogin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadOnboardingStatus();
  }, []);

  const loadOnboardingStatus = async () => {
    try {
      const [onboarding, firstPet, firstLogin] = await Promise.all([
        AsyncStorage.getItem(ONBOARDING_KEY),
        AsyncStorage.getItem(FIRST_PET_KEY),
        AsyncStorage.getItem(FIRST_LOGIN_KEY),
      ]);

      setHasSeenOnboarding(onboarding === 'true');
      setHasCreatedFirstPet(firstPet === 'true');
      setIsFirstLogin(firstLogin === 'true');
    } catch (error) {
      console.error("Error loading onboarding:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
    setHasSeenOnboarding(true);
  };

  const completeFirstPetSetup = async () => {
    await AsyncStorage.setItem(FIRST_PET_KEY, 'true');
    await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'false');
    setHasCreatedFirstPet(true);
    setIsFirstLogin(false);
  };

  const markFirstLogin = async () => {
    await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'true');
    setIsFirstLogin(true);
  };

  const resetOnboarding = async () => {
    await Promise.all([
      AsyncStorage.removeItem(ONBOARDING_KEY),
      AsyncStorage.removeItem(FIRST_PET_KEY),
      AsyncStorage.removeItem(FIRST_LOGIN_KEY),
    ]);

    setHasSeenOnboarding(false);
    setHasCreatedFirstPet(false);
    setIsFirstLogin(false);
  };

  // 🔥 TEST_MODE fuerza que SIEMPRE falte el onboarding
  const overriddenHasSeenOnboarding = TEST_MODE ? false : hasSeenOnboarding;

  return (
    <OnboardingContext.Provider
      value={{
        hasSeenOnboarding: overriddenHasSeenOnboarding,
        hasCreatedFirstPet,
        isFirstLogin,
        completeOnboarding,
        completeFirstPetSetup,
        markFirstLogin,
        resetOnboarding,
        isLoading,
      }}
    >
      {children}
    </OnboardingContext.Provider>
  );
};

export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within an OnboardingProvider");
  }
  return context;
};
