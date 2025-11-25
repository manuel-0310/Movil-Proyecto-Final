// app/(tabs)/home.tsx
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  ActivityIndicator,
  Dimensions,
  Alert,
  Animated,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import EditVaccineModal from "@/components/EditVaccineModal";
import EditMedicalRecordModal from "@/components/EditMedicalRecordModal";
import EditPetModal from "@/components/EditPetModal";
import QRModal from "@/components/QRmodal";

const { width } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  weight: number;
  photo_url?: string;
  user_id?: string;
}

interface UserProfile {
  name: string;
}

interface Vaccine {
  id: string;
  name: string;
  date: string;
  notes?: string;
  pet_id: string;
}

interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  description?: string;
  vet_name?: string;
  notes?: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [vaccines, setVaccines] = useState<Vaccine[]>([]);
  const [medicalRecords, setMedicalRecords] = useState<MedicalRecord[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedVaccine, setSelectedVaccine] = useState<Vaccine | null>(null);
  const [showEditVaccineModal, setShowEditVaccineModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [showEditRecordModal, setShowEditRecordModal] = useState(false);
  const [showAllVaccines, setShowAllVaccines] = useState(false);
  const [showAllRecords, setShowAllRecords] = useState(false);
  const [showEditPetModal, setShowEditPetModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (user) {
      loadUserData();
      loadPets();
    }
  }, [user]);

  useEffect(() => {
    if (selectedPet) {
      loadPetDetails();
      setShowAllVaccines(false);
      setShowAllRecords(false);
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [selectedPet]);

  const loadUserData = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', user?.id)
        .single();

      if (data) {
        const firstName = data.name.split(' ')[0];
        setUserName(firstName);
      }
    } catch (error) {
      console.error('Error loading user:', error);
    }
  };

  const loadPets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPets(data || []);
      if (data && data.length > 0) {
        setSelectedPet(data[0]);
      }
    } catch (error) {
      console.error('Error loading pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPetDetails = async () => {
    if (!selectedPet) return;

    try {
      // Cargar todas las vacunas (sin límite)
      const { data: vaccinesData, error: vaccinesError } = await supabase
        .from('vaccines')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .order('date', { ascending: false });

      if (!vaccinesError) {
        setVaccines(vaccinesData || []);
      }

      // Cargar todo el historial médico (sin límite)
      const { data: recordsData, error: recordsError } = await supabase
        .from('medical_records')
        .select('*')
        .eq('pet_id', selectedPet.id)
        .order('date', { ascending: false });

      if (!recordsError) {
        setMedicalRecords(recordsData || []);
      }
    } catch (error) {
      console.error('Error loading pet details:', error);
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

  const sendQuickMessage = async () => {
    if (!message.trim() || sending) return;

    try {
      setSending(true);

      // Crear nuevo chat
      const { data: chatData, error: chatError } = await supabase
        .from('chats')
        .insert([
          {
            user_id: user?.id,
            title: 'Nueva consulta',
          },
        ])
        .select()
        .single();

      if (chatError) throw chatError;

      // Enviar mensaje inicial
      const { error: messageError } = await supabase
        .from('messages')
        .insert([
          {
            chat_id: chatData.id,
            role: 'user',
            content: message.trim(),
          },
        ]);

      if (messageError) throw messageError;

      // Limpiar y navegar
      setMessage('');
      router.push(`/chats/${chatData.id}`);
    } catch (error) {
      console.error('Error sending message:', error);
      Alert.alert('Error', 'No se pudo enviar el mensaje');
    } finally {
      setSending(false);
    }
  };

  const getPetIcon = (type: string) => {
    const icons: { [key: string]: string } = {
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

  // Determinar qué vacunas mostrar
  const displayedVaccines = showAllVaccines ? vaccines : vaccines.slice(0, 5);
  const hasMoreVaccines = vaccines.length > 5;

  // Determinar qué registros mostrar
  const displayedRecords = showAllRecords ? medicalRecords : medicalRecords.slice(0, 5);
  const hasMoreRecords = medicalRecords.length > 5;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hola, {userName || ''}</Text>
            <Text style={styles.question}>
              ¿Qué pregunta tienes hoy para nuestro Veterinario Virtual?
            </Text>
          </View>cd myv
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => setShowQRModal(true)}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* QUICK MESSAGE INPUT */}
        <View style={styles.quickMessageContainer}>
          <TextInput
            style={styles.quickMessageInput}
            placeholder="escribe tu mensaje..."
            placeholderTextColor="rgba(255,255,255,0.6)"
            value={message}
            onChangeText={setMessage}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!message.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendQuickMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color="#7B2CBF" />
            ) : (
              <Ionicons name="send" size={20} color="#7B2CBF" />
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* PETS SECTION */}
      <View style={styles.petsSection}>
        {/* PETS CHIPS */}
        <View style={styles.petsChipsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.petsChipsScroll}
          >
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[
                  styles.petChip,
                  selectedPet?.id === pet.id && styles.petChipSelected,
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text
                  style={[
                    styles.petChipText,
                    selectedPet?.id === pet.id && styles.petChipTextSelected,
                  ]}
                >
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* + NEW BUTTON */}
            <TouchableOpacity
              style={styles.newPetChip}
              onPress={() => router.push('../add-pet')}
            >
              <Text style={styles.newPetChipText}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* PET DETAILED CARD */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
          </View>
        ) : selectedPet ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* PET INFO CARD - NUEVA ESTRUCTURA */}
            <View style={styles.petInfoCard}>
              {/* HEADER CON FOTO Y NOMBRE */}
              <View style={styles.petCardHeader}>
                <View style={styles.petPhotoSection}>
                  {selectedPet.photo_url ? (
                    <Image source={{ uri: selectedPet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={styles.petPhotoPlaceholder}>
                      <Ionicons name={getPetIcon(selectedPet.type) as any} size={50} color="#7B2CBF" />
                    </View>
                  )}
                </View>

                <View style={styles.petHeaderInfo}>
                  <View style={styles.petNameRow}>
                    <View style={styles.petNameContainer}>
                      <Text style={styles.petName}>{selectedPet.name}</Text>
                      <Text style={styles.petBreed}>{selectedPet.breed || 'Sin raza'}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.editButton}
                      onPress={() => setShowEditPetModal(true)}
                    >
                      <Ionicons name="create-outline" size={22} color="#7B2CBF" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* DIVIDER */}
              <View style={styles.divider} />

              {/* BASIC INFO GRID */}
              <View style={styles.basicInfo}>
                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="calendar-outline" size={18} color="#7B2CBF" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Edad</Text>
                      <Text style={styles.infoValue}>{calculateAge(selectedPet.birthday)}</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name={selectedPet.sex === 'Male' ? 'male' : 'female'} size={18} color="#7B2CBF" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Sexo</Text>
                      <Text style={styles.infoValue}>
                        {selectedPet.sex === 'Male' ? 'Macho' : selectedPet.sex === 'Female' ? 'Hembra' : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="scale-outline" size={18} color="#7B2CBF" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Peso</Text>
                      <Text style={styles.infoValue}>{selectedPet.weight} kg</Text>
                    </View>
                  </View>

                  <View style={styles.infoItem}>
                    <View style={styles.infoIconContainer}>
                      <Ionicons name="person-outline" size={18} color="#7B2CBF" />
                    </View>
                    <View>
                      <Text style={styles.infoLabel}>Dueño</Text>
                      <Text style={styles.infoValue} numberOfLines={1}>
                        {userName}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>

            {/* VACCINES SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Vacunas</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/add-vaccine', params: { petId: selectedPet.id } })}
                >
                  <Text style={styles.addButton}>Agregar vacuna</Text>
                </TouchableOpacity>
              </View>

              {vaccines.length > 0 ? (
                <>
                  {displayedVaccines.map((vaccine) => (
                    <TouchableOpacity
                      key={vaccine.id}
                      style={styles.listItem}
                      onPress={() => {
                        setSelectedVaccine(vaccine);
                        setShowEditVaccineModal(true);
                      }}
                    >
                      <View style={styles.listIcon}>
                        <Ionicons name="medical" size={24} color="#7B2CBF" />
                      </View>
                      <View style={styles.listContent}>
                        <Text style={styles.listTitle}>{vaccine.name}</Text>
                        {vaccine.notes && (
                          <Text style={styles.listSubtitle} numberOfLines={1}>
                            {vaccine.notes}
                          </Text>
                        )}
                      </View>
                      <Text style={styles.listDate}>{formatDate(vaccine.date)}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* BOTÓN VER MÁS / VER MENOS */}
                  {hasMoreVaccines && (
                    <TouchableOpacity
                      style={styles.viewMoreButton}
                      onPress={() => setShowAllVaccines(!showAllVaccines)}
                    >
                      <Text style={styles.viewMoreText}>
                        {showAllVaccines ? 'Ver menos' : `Ver más (${vaccines.length - 5} más)`}
                      </Text>
                      <Ionicons 
                        name={showAllVaccines ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color="#7B2CBF" 
                      />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No hay vacunas registradas</Text>
                </View>
              )}
            </View>

            {/* MEDICAL HISTORY SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Historial médico</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/add-medical-record', params: { petId: selectedPet.id } })}
                >
                  <Text style={styles.addButton}>Nuevo registro</Text>
                </TouchableOpacity>
              </View>

              {medicalRecords.length > 0 ? (
                <>
                  {displayedRecords.map((record) => (
                    <TouchableOpacity
                      key={record.id}
                      style={styles.listItem}
                      onPress={() => {
                        setSelectedRecord(record);
                        setShowEditRecordModal(true);
                      }}
                    >
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
                    </TouchableOpacity>
                  ))}
                  
                  {/* BOTÓN VER MÁS / VER MENOS */}
                  {hasMoreRecords && (
                    <TouchableOpacity
                      style={styles.viewMoreButton}
                      onPress={() => setShowAllRecords(!showAllRecords)}
                    >
                      <Text style={styles.viewMoreText}>
                        {showAllRecords ? 'Ver menos' : `Ver más (${medicalRecords.length - 5} más)`}
                      </Text>
                      <Ionicons 
                        name={showAllRecords ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color="#7B2CBF" 
                      />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color="#D1D5DB" />
                  <Text style={styles.emptyText}>No hay historial médico</Text>
                </View>
              )}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.noPetsContainer}>
            <Ionicons name="paw-outline" size={80} color="#D1D5DB" />
            <Text style={styles.noPetsTitle}>No tienes mascotas</Text>
            <Text style={styles.noPetsSubtitle}>
              Crea tu primera mascota para comenzar
            </Text>
          </View>
        )}
      </View>

      {/* MODALS */}
      {selectedVaccine && (
        <EditVaccineModal
          visible={showEditVaccineModal}
          vaccine={selectedVaccine}
          onClose={() => setShowEditVaccineModal(false)}
          onSave={loadPetDetails}
        />
      )}
      {selectedRecord && (
        <EditMedicalRecordModal
          visible={showEditRecordModal}
          record={selectedRecord}
          onClose={() => setShowEditRecordModal(false)}
          onSave={loadPetDetails}
        />
      )}
      {selectedPet && (
        <EditPetModal
          visible={showEditPetModal}
          pet={{
            id: selectedPet.id,
            name: selectedPet.name,
            type: selectedPet.type,
            breed: selectedPet.breed,
            sex: selectedPet.sex,
            birthday: selectedPet.birthday,
            weight: selectedPet.weight,
            photo_url: selectedPet.photo_url,
          }}
          onClose={() => setShowEditPetModal(false)}
          onSave={loadPets}
        />
      )}

      <QRModal visible={showQRModal} onClose={() => setShowQRModal(false)} />

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    backgroundColor: '#7B2FF7',
    paddingTop: 60,
    paddingBottom: 30,
    paddingHorizontal: 25,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },

  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 25,
  },

  logoContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  qrButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  greeting: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
    marginTop: 58
  },

  question: {
    fontSize: 28,
    color: '#fff',
    lineHeight: 28,
    maxWidth: width * 0.7,
  },

  /* QUICK MESSAGE */
  quickMessageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },

  quickMessageInput: {
    flex: 1,
    color: '#fff',
    fontSize: 15,
    maxHeight: 80,
    paddingVertical: 8,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  /* PETS SECTION */
  petsSection: {
    paddingTop: 25,
    paddingHorizontal: 25,
    paddingBottom: 100,
  },

  petsChipsContainer: {
    marginBottom: 20,
  },

  petsChipsScroll: {
    paddingRight: 20,
    gap: 12,
  },

  petChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#7B2FF7',
    backgroundColor: '#fff',
  },

  petChipSelected: {
    backgroundColor: '#7B2FF7',
  },

  petChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2FF7',
  },

  petChipTextSelected: {
    color: '#fff',
  },

  newPetChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    backgroundColor: '#fff',
  },

  newPetChipText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#9CA3AF',
  },

  /* PET INFO CARD - NUEVA ESTRUCTURA */
  petInfoCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    marginBottom: 20,
    overflow: 'hidden',
  },

  petCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingBottom: 16,
  },

  petPhotoSection: {
    marginRight: 16,
  },

  petPhoto: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
    borderColor: '#7B2CBF',
  },

  petPhotoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F3F4F6',
    borderWidth: 3,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  petHeaderInfo: {
    flex: 1,
  },

  petNameRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },

  petNameContainer: {
    flex: 1,
  },

  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  petBreed: {
    fontSize: 15,
    color: '#6B7280',
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  divider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 20,
  },

  basicInfo: {
    padding: 20,
    paddingTop: 16,
    gap: 12,
  },

  infoRow: {
    flexDirection: 'row',
    gap: 12,
  },

  infoItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },

  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },

  /* SECTIONS */
  section: {
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

  /* VER MÁS / VER MENOS BUTTON */
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    gap: 6,
  },

  viewMoreText: {
    fontSize: 14,
    color: '#7B2CBF',
    fontWeight: '600',
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

  /* NO PETS */
  noPetsContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  noPetsTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 20,
    marginBottom: 8,
  },

  noPetsSubtitle: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 25,
  },

  /* LOADING */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});