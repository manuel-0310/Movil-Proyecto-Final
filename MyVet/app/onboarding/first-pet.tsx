// app/onboarding/first-pet.tsx
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useOnboarding } from '@/contexts/OnboardingContext';
import { Ionicons } from '@expo/vector-icons';

export default function FirstPetScreen() {
  const router = useRouter();
  const { completeFirstPetSetup } = useOnboarding();

  const handleCreatePet = () => {
    router.push('/add-pet');
  };

  const handleSkip = async () => {
    await completeFirstPetSetup();
    router.replace('/(tabs)/home');
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      

      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.mainIcon}>🐕</Text>
        </View>

        <Text style={styles.title}>¡Agrega tu Primera Mascota!</Text>
        
        <Text style={styles.description}>
          Comienza registrando a tu compañero peludo. Podrás llevar un seguimiento
          completo de su salud, vacunas y citas veterinarias.
        </Text>

        <View style={styles.featuresContainer}>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📸</Text>
            <Text style={styles.featureText}>Sube una foto</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>📝</Text>
            <Text style={styles.featureText}>Ponle un nombre</Text>
          </View>
          <View style={styles.feature}>
            <Text style={styles.featureIcon}>🏥</Text>
            <Text style={styles.featureText}>Información básica</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primaryButton} onPress={handleCreatePet}>
          <Text style={styles.primaryButtonText}>Crear mi Primera Mascota</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} onPress={handleSkip}>
          <Text style={styles.secondaryButtonText}>Lo haré después</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    height: 150,
    backgroundColor: '#7B2CBF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  mainIcon: {
    fontSize: 70,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 15,
  },
  description: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 40,
  },
  feature: {
    alignItems: 'center',
    flex: 1,
  },
  featureIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  featureText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  primaryButton: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    marginBottom: 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  secondaryButton: {
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 30,
    width: '100%',
    borderWidth: 2,
    borderColor: '#7B2CBF',
    backgroundColor: 'transparent',
  },
  secondaryButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  decorationIcon: {
    fontSize: 24,
    opacity: 0.3,
  },
});