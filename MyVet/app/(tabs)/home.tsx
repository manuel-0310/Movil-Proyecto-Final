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
import { useTheme } from '@/contexts/ThemeContext';
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
  const { theme } = useTheme();
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
    <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]} showsVerticalScrollIndicator={false}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>Hola, {userName || ''}</Text>
            <Text style={styles.question}>
              ¿Qué pregunta tienes hoy para nuestro Veterinario Virtual?
            </Text>
          </View>
          <TouchableOpacity 
            style={styles.qrButton}
            onPress={() => setShowQRModal(true)}
          >
            <Ionicons name="qr-code" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* QUICK MESSAGE INPUT */}
        <View style={[styles.quickMessageContainer, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <TextInput
            style={[styles.quickMessageInput, { color: theme.colors.textInverse }]}
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
              { backgroundColor: theme.colors.textInverse },
              (!message.trim() || sending) && styles.sendButtonDisabled,
            ]}
            onPress={sendQuickMessage}
            disabled={!message.trim() || sending}
          >
            {sending ? (
              <ActivityIndicator size="small" color={theme.colors.primary} />
            ) : (
              <Ionicons name="send" size={20} color={theme.colors.primary} />
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
                  { 
                    borderColor: theme.colors.primary,
                    backgroundColor: theme.colors.card
                  },
                  selectedPet?.id === pet.id && { backgroundColor: theme.colors.primary },
                ]}
                onPress={() => setSelectedPet(pet)}
              >
                <Text
                  style={[
                    styles.petChipText,
                    { color: theme.colors.primary },
                    selectedPet?.id === pet.id && { color: theme.colors.textInverse },
                  ]}
                >
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}

            {/* + NEW BUTTON */}
            <TouchableOpacity
              style={[styles.newPetChip, { 
                borderColor: theme.colors.border,
                backgroundColor: theme.colors.card
              }]}
              onPress={() => router.push('../add-pet')}
            >
              <Text style={[styles.newPetChipText, { color: theme.colors.textTertiary }]}>+</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>

        {/* PET DETAILED CARD */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
          </View>
        ) : selectedPet ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            {/* PET INFO CARD - NUEVA ESTRUCTURA */}
            <View style={[styles.petInfoCard, { backgroundColor: theme.colors.card, shadowColor: theme.colors.shadow }]}>
              {/* HEADER CON FOTO Y NOMBRE */}
              <View style={styles.petCardHeader}>
                <View style={styles.petPhotoSection}>
                  {selectedPet.photo_url ? (
                    <Image source={{ uri: selectedPet.photo_url }} style={[styles.petPhoto, { borderColor: theme.colors.primary }]} />
                  ) : (
                    <View style={[styles.petPhotoPlaceholder, { backgroundColor: theme.colors.backgroundTertiary, borderColor: theme.colors.primary }]}>
                      <Ionicons name={getPetIcon(selectedPet.type) as any} size={50} color={theme.colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.petHeaderInfo}>
                  <View style={styles.petNameRow}>
                    <View style={styles.petNameContainer}>
                      <Text style={[styles.petName, { color: theme.colors.text }]}>{selectedPet.name}</Text>
                      <Text style={[styles.petBreed, { color: theme.colors.textSecondary }]}>{selectedPet.breed || 'Sin raza'}</Text>
                    </View>
                    <TouchableOpacity 
                      style={[styles.editButton, { backgroundColor: theme.colors.primaryLight }]}
                      onPress={() => setShowEditPetModal(true)}
                    >
                      <Ionicons name="create-outline" size={22} color={theme.colors.primary} />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>

              {/* DIVIDER */}
              <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />

              {/* BASIC INFO GRID */}
              <View style={styles.basicInfo}>
                <View style={styles.infoRow}>
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="calendar-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Edad</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{calculateAge(selectedPet.birthday)}</Text>
                    </View>
                  </View>

                  <View style={[styles.infoItem, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name={selectedPet.sex === 'Male' ? 'male' : 'female'} size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Sexo</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>
                        {selectedPet.sex === 'Male' ? 'Macho' : selectedPet.sex === 'Female' ? 'Hembra' : 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>

                <View style={styles.infoRow}>
                  <View style={[styles.infoItem, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="scale-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Peso</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]}>{selectedPet.weight} kg</Text>
                    </View>
                  </View>

                  <View style={[styles.infoItem, { backgroundColor: theme.colors.cardBackground }]}>
                    <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                      <Ionicons name="person-outline" size={18} color={theme.colors.primary} />
                    </View>
                    <View>
                      <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Dueño</Text>
                      <Text style={[styles.infoValue, { color: theme.colors.text }]} numberOfLines={1}>
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
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Vacunas</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/add-vaccine', params: { petId: selectedPet.id } })}
                >
                  <Text style={[styles.addButton, { color: theme.colors.primary }]}>Agregar vacuna</Text>
                </TouchableOpacity>
              </View>

              {vaccines.length > 0 ? (
                <>
                  {displayedVaccines.map((vaccine) => (
                    <TouchableOpacity
                      key={vaccine.id}
                      style={[styles.listItem, { backgroundColor: theme.colors.cardBackground }]}
                      onPress={() => {
                        setSelectedVaccine(vaccine);
                        setShowEditVaccineModal(true);
                      }}
                    >
                      <View style={[styles.listIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="medical" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.listContent}>
                        <Text style={[styles.listTitle, { color: theme.colors.text }]}>{vaccine.name}</Text>
                        {vaccine.notes && (
                          <Text style={[styles.listSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {vaccine.notes}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.listDate, { color: theme.colors.textTertiary }]}>{formatDate(vaccine.date)}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* BOTÓN VER MÁS / VER MENOS */}
                  {hasMoreVaccines && (
                    <TouchableOpacity
                      style={[styles.viewMoreButton, { backgroundColor: theme.colors.cardBackground }]}
                      onPress={() => setShowAllVaccines(!showAllVaccines)}
                    >
                      <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
                        {showAllVaccines ? 'Ver menos' : `Ver más (${vaccines.length - 5} más)`}
                      </Text>
                      <Ionicons 
                        name={showAllVaccines ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color={theme.colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="medical-outline" size={48} color={theme.colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No hay vacunas registradas</Text>
                </View>
              )}
            </View>

            {/* MEDICAL HISTORY SECTION */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Historial médico</Text>
                <TouchableOpacity
                  onPress={() => router.push({ pathname: '/add-medical-record', params: { petId: selectedPet.id } })}
                >
                  <Text style={[styles.addButton, { color: theme.colors.primary }]}>Nuevo registro</Text>
                </TouchableOpacity>
              </View>

              {medicalRecords.length > 0 ? (
                <>
                  {displayedRecords.map((record) => (
                    <TouchableOpacity
                      key={record.id}
                      style={[styles.listItem, { backgroundColor: theme.colors.cardBackground }]}
                      onPress={() => {
                        setSelectedRecord(record);
                        setShowEditRecordModal(true);
                      }}
                    >
                      <View style={[styles.listIcon, { backgroundColor: theme.colors.primaryLight }]}>
                        <Ionicons name="add-circle" size={24} color={theme.colors.primary} />
                      </View>
                      <View style={styles.listContent}>
                        <Text style={[styles.listTitle, { color: theme.colors.text }]}>{record.title}</Text>
                        {record.description && (
                          <Text style={[styles.listSubtitle, { color: theme.colors.textSecondary }]} numberOfLines={1}>
                            {record.description}
                          </Text>
                        )}
                      </View>
                      <Text style={[styles.listDate, { color: theme.colors.textTertiary }]}>{formatDate(record.date)}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* BOTÓN VER MÁS / VER MENOS */}
                  {hasMoreRecords && (
                    <TouchableOpacity
                      style={[styles.viewMoreButton, { backgroundColor: theme.colors.cardBackground }]}
                      onPress={() => setShowAllRecords(!showAllRecords)}
                    >
                      <Text style={[styles.viewMoreText, { color: theme.colors.primary }]}>
                        {showAllRecords ? 'Ver menos' : `Ver más (${medicalRecords.length - 5} más)`}
                      </Text>
                      <Ionicons 
                        name={showAllRecords ? 'chevron-up' : 'chevron-down'} 
                        size={18} 
                        color={theme.colors.primary} 
                      />
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                <View style={styles.emptyState}>
                  <Ionicons name="document-text-outline" size={48} color={theme.colors.textTertiary} />
                  <Text style={[styles.emptyText, { color: theme.colors.textTertiary }]}>No hay historial médico</Text>
                </View>
              )}
            </View>
          </Animated.View>
        ) : (
          <View style={styles.noPetsContainer}>
            <Ionicons name="paw-outline" size={80} color={theme.colors.textTertiary} />
            <Text style={[styles.noPetsTitle, { color: theme.colors.text }]}>No tienes mascotas</Text>
            <Text style={[styles.noPetsSubtitle, { color: theme.colors.textSecondary }]}>
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
  },

  /* HEADER */
  header: {
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
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },

  quickMessageInput: {
    flex: 1,
    fontSize: 15,
    maxHeight: 80,
    paddingVertical: 8,
  },

  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
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
  },

  petChipText: {
    fontSize: 16,
    fontWeight: '600',
  },

  newPetChip: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 2,
  },

  newPetChipText: {
    fontSize: 16,
    fontWeight: '800',
  },

  /* PET INFO CARD - NUEVA ESTRUCTURA */
  petInfoCard: {
    borderRadius: 20,
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
  },

  petPhotoPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 3,
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
    marginBottom: 4,
  },

  petBreed: {
    fontSize: 15,
  },

  editButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },

  divider: {
    height: 1,
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
    padding: 14,
    borderRadius: 12,
    gap: 12,
  },

  infoIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
    fontWeight: '500',
  },

  infoValue: {
    fontSize: 15,
    fontWeight: '600',
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
  },

  addButton: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* LIST ITEMS */
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  listIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 2,
  },

  listSubtitle: {
    fontSize: 14,
  },

  listDate: {
    fontSize: 12,
    fontWeight: '500',
  },

  /* VER MÁS / VER MENOS BUTTON */
  viewMoreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 4,
    gap: 6,
  },

  viewMoreText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
  },

  emptyText: {
    fontSize: 14,
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
    marginTop: 20,
    marginBottom: 8,
  },

  noPetsSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 25,
  },

  /* LOADING */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});