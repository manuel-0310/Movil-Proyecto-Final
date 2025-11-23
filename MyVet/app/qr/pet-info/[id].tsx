// app/qr/pet-info/[id].tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  weight: number;
  photo_url?: string;
  user_id: string;
}

interface Owner {
  name: string;
  email: string;
  phone?: string;
}

export default function PetInfoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [owner, setOwner] = useState<Owner | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      loadPetInfo();
    }
  }, [id]);

  const loadPetInfo = async () => {
    try {
      setLoading(true);

      // Cargar información de la mascota
      const { data: petData, error: petError } = await supabase
        .from('pets')
        .select('*')
        .eq('id', id)
        .single();

      if (petError) throw petError;
      setPet(petData);

      // Cargar información del dueño
      const { data: ownerData, error: ownerError } = await supabase
        .from('profiles')
        .select('name, email, phone')
        .eq('id', petData.user_id)
        .single();

      if (ownerError) throw ownerError;
      setOwner(ownerData);
    } catch (error) {
      console.error('Error loading pet info:', error);
      Alert.alert('Error', 'No se pudo cargar la información de la mascota');
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - birthDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    if (years === 0) {
      return `${months} ${months === 1 ? 'mes' : 'meses'}`;
    } else if (months === 0) {
      return `${years} ${years === 1 ? 'año' : 'años'}`;
    } else {
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${
        months === 1 ? 'mes' : 'meses'
      }`;
    }
  };

  const handleCall = () => {
    if (owner?.phone) {
      Linking.openURL(`tel:${owner.phone}`);
    }
  };

  const handleEmail = () => {
    if (owner?.email) {
      Linking.openURL(`mailto:${owner.email}`);
    }
  };

  const getPetIcon = (type: string): IoniconsName => {
    const icons: { [key: string]: IoniconsName } = {
      dog: 'paw',
      cat: 'heart',
      bird: 'airplane',
      rabbit: 'happy',
      hamster: 'radio-button-on',
      fish: 'water',
      turtle: 'shield',
      other: 'ellipsis-horizontal',
    };
    return icons[type] || 'paw';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
      </View>
    );
  }

  if (!pet || !owner) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle" size={64} color="#EF4444" />
        <Text style={styles.errorText}>Mascota no encontrada</Text>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Volver</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.push("/home")}
          style={styles.closeButton}
        >
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerIcon}>
          <Ionicons name="paw" size={32} color="#fff" />
        </View>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
      >
        {/* PET INFO CARD */}
        <View style={styles.petCard}>
          {pet.photo_url ? (
            <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
          ) : (
            <View style={styles.petPhotoPlaceholder}>
              <Ionicons name={getPetIcon(pet.type)} size={60} color="#7B2CBF" />
            </View>
          )}

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>{pet.breed || 'Sin raza'}</Text>

          <View style={styles.infoGrid}>
            <View style={styles.infoItem}>
              <Ionicons name="calendar-outline" size={20} color="#7B2CBF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Edad</Text>
                <Text style={styles.infoValue}>{calculateAge(pet.birthday)}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons
                name={pet.sex === 'Male' ? 'male' : 'female'}
                size={20}
                color="#7B2CBF"
              />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Sexo</Text>
                <Text style={styles.infoValue}>
                  {pet.sex === 'Male' ? 'Macho' : 'Hembra'}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="scale-outline" size={20} color="#7B2CBF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Peso</Text>
                <Text style={styles.infoValue}>{pet.weight} kg</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <Ionicons name="paw-outline" size={20} color="#7B2CBF" />
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoLabel}>Tipo</Text>
                <Text style={styles.infoValue}>
                  {pet.type === 'dog' ? 'Perro' : pet.type === 'cat' ? 'Gato' : pet.type}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* OWNER INFO */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Información del dueño</Text>
          <View style={styles.ownerCard}>
            <View style={styles.ownerInfo}>
              <Ionicons name="person-circle" size={48} color="#7B2CBF" />
              <View style={styles.ownerDetails}>
                <Text style={styles.ownerName}>{owner.name}</Text>
                {owner.email && (
                  <Text style={styles.ownerContact}>{owner.email}</Text>
                )}
                {owner.phone && (
                  <Text style={styles.ownerContact}>{owner.phone}</Text>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* CONTACT BUTTONS */}
        <View style={styles.contactButtons}>
          {owner.phone && (
            <TouchableOpacity style={styles.contactButton} onPress={handleCall}>
              <Ionicons name="call" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Llamar</Text>
            </TouchableOpacity>
          )}

          {owner.email && (
            <TouchableOpacity style={styles.contactButton} onPress={handleEmail}>
              <Ionicons name="mail" size={24} color="#fff" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ALERT MESSAGE */}
        <View style={styles.alertCard}>
          <Ionicons name="information-circle" size={24} color="#7B2CBF" />
          <Text style={styles.alertText}>
            Si encontraste a {pet.name}, por favor contacta a su dueño lo antes
            posible. ¡Gracias por ayudar!
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },

  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },

  header: {
    backgroundColor: '#7B2CBF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  closeButton: {
    padding: 8,
  },

  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  content: {
    flex: 1,
  },

  contentContainer: {
    padding: 24,
  },

  petCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 24,
  },

  petPhoto: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 4,
    borderColor: '#7B2CBF',
    marginBottom: 16,
  },

  petPhotoPlaceholder: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  petName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  petBreed: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 24,
  },

  infoGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },

  infoItem: {
    flex: 1,
    minWidth: '45%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  section: {
    marginBottom: 24,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },

  ownerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
  },

  ownerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },

  ownerDetails: {
    flex: 1,
  },

  ownerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  ownerContact: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 2,
  },

  contactButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },

  contactButton: {
    flex: 1,
    backgroundColor: '#7B2CBF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 16,
    gap: 8,
  },

  contactButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  alertCard: {
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 16,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },

  alertText: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },

  backButton: {
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },

  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});