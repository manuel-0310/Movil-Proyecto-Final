// app/(tabs)/pet-detail/[id].tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  Animated,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  photo_url?: string;
  user_id: string;
}

interface Vaccine {
  id: string;
  name: string;
  date: string;
  notes?: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  description?: string;
  vet_name?: string;
  notes?: string;
}

export default function PetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [pet, setPet] = useState<Pet | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (id) {
      loadPetData();
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [id]);

  const loadPetData = async () => {
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

      // Cargar nombre del dueño
      const { data: profileData } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', petData.user_id)
        .single();

      if (profileData) {
        setUserName(profileData.name);
      }

      // Cargar vacunas
      const { data: vaccinesData, error: vaccinesError } = await supabase
        .from('vaccines')
        .select('*')
        .eq('pet_id', id)
        .order('date', { ascending: false })
        .limit(3);

      if (!vaccinesError) {
        setVaccines(vaccinesData || []);
      }

      // Cargar historial médico
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', id)
        .order('date', { ascending: false })
        .limit(5);

      if (!recordsError) {
        setMedicalRecords(recordsData || []);
      }
    } catch (error) {
      console.error('Error loading pet data:', error);
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
      return `${years} ${years === 1 ? 'año' : 'años'} y ${months} ${months === 1 ? 'mes' : 'meses'}`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit',
    });
  };

  const getPetIcon = (type: string) => {
    const icons: { [key: string]: any } = {
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

  if (!pet) {
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
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Home</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* PET INFO CARD */}
        <View style={styles.petInfoCard}>
          <View style={styles.petPhotoSection}>
            {pet.photo_url ? (
              <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
            ) : (
              <View style={styles.petPhotoPlaceholder}>
                <Ionicons name={getPetIcon(pet.type)} size={60} color="#7B2CBF" />
              </View>
            )}
          </View>

          <Text style={styles.petName}>{pet.name}</Text>
          <Text style={styles.petBreed}>{pet.breed || 'Sin raza'}</Text>

          {/* BASIC INFO */}
          <View style={styles.basicInfo}>
            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Age</Text>
                <Text style={styles.infoValue}>{calculateAge(pet.birthday)}</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Sex</Text>
                <Text style={styles.infoValue}>
                  {pet.sex === 'Male' ? 'Male' : pet.sex === 'Female' ? 'Female' : 'Unknown'}
                </Text>
              </View>
            </View>

            <View style={styles.infoRow}>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Weight</Text>
                <Text style={styles.infoValue}>18kg</Text>
              </View>
              <View style={styles.infoItem}>
                <Text style={styles.infoLabel}>Owner</Text>
                <Text style={styles.infoValue} numberOfLines={1}>
                  {userName}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* VACCINES SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Vaccines</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/add-vaccine', params: { petId: pet.id } })}
            >
              <Text style={styles.addButton}>Add New Vaccine</Text>
            </TouchableOpacity>
          </View>

          {vaccines.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="medical-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay vacunas registradas</Text>
            </View>
          ) : (
            vaccines.map((vaccine) => (
              <View key={vaccine.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Ionicons name="medical" size={24} color="#7B2CBF" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{vaccine.name}</Text>
                  {vaccine.notes && (
                    <Text style={styles.listSubtitle}>{vaccine.notes}</Text>
                  )}
                </View>
                <Text style={styles.listDate}>{formatDate(vaccine.date)}</Text>
              </View>
            ))
          )}
        </View>

        {/* MEDICAL HISTORY SECTION */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Medical History</Text>
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/add-medical-record', params: { petId: pet.id } })}
            >
              <Text style={styles.addButton}>Add New</Text>
            </TouchableOpacity>
          </View>

          {medicalRecords.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="document-text-outline" size={40} color="#D1D5DB" />
              <Text style={styles.emptyText}>No hay registros médicos</Text>
            </View>
          ) : (
            medicalRecords.map((record) => (
              <View key={record.id} style={styles.listItem}>
                <View style={styles.listIcon}>
                  <Ionicons name="add-circle" size={24} color="#7B2CBF" />
                </View>
                <View style={styles.listContent}>
                  <Text style={styles.listTitle}>{record.title}</Text>
                  {record.description && (
                    <Text style={styles.listSubtitle} numberOfLines={1}>
                      {record.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.listDate}>{formatDate(record.date)}</Text>
              </View>
            ))
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </Animated.View>
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
    padding: 20,
  },

  errorText: {
    fontSize: 18,
    color: '#6B7280',
    marginTop: 16,
    marginBottom: 24,
  },

  /* HEADER */
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

  backBtn: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  /* PET INFO CARD */
  petInfoCard: {
    backgroundColor: '#fff',
    padding: 24,
    alignItems: 'center',
  },

  petPhotoSection: {
    marginBottom: 16,
  },

  petPhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: '#7B2CBF',
  },

  petPhotoPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F3F4F6',
    borderWidth: 4,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
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

  basicInfo: {
    width: '100%',
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },

  infoItem: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
  },

  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },

  /* SECTIONS */
  section: {
    paddingHorizontal: 24,
    paddingVertical: 16,
  },

  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },

  addButton: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '600',
  },

  /* LIST ITEMS */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  listContent: {
    flex: 1,
  },

  listTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },

  listSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },

  listDate: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
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