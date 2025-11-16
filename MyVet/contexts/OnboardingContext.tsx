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

export const OnboardingProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
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
      console.error('Error loading onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const completeOnboarding = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, 'true');
      setHasSeenOnboarding(true);
    } catch (error) {
      console.error('Error completing onboarding:', error);
    }
  };

  const completeFirstPetSetup = async () => {
    try {
      await AsyncStorage.setItem(FIRST_PET_KEY, 'true');
      setHasCreatedFirstPet(true);
      // También marcamos que ya no es el primer login
      await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'false');
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Error completing first pet setup:', error);
    }
  };

  const markFirstLogin = async () => {
    try {
      await AsyncStorage.setItem(FIRST_LOGIN_KEY, 'true');
      setIsFirstLogin(true);
    } catch (error) {
      console.error('Error marking first login:', error);
    }
  };

  const resetOnboarding = async () => {
    try {
      await Promise.all([
        AsyncStorage.removeItem(ONBOARDING_KEY),
        AsyncStorage.removeItem(FIRST_PET_KEY),
        AsyncStorage.removeItem(FIRST_LOGIN_KEY),
      ]);
      setHasSeenOnboarding(false);
      setHasCreatedFirstPet(false);
      setIsFirstLogin(false);
    } catch (error) {
      console.error('Error resetting onboarding:', error);
    }
  };

  return (
    <OnboardingContext.Provider
      value={{
        hasSeenOnboarding,
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
    throw new Error('useOnboarding must be used within an OnboardingProvider');
  }
  return context;
};