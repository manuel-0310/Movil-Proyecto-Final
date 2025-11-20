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
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  weight: string;
  photo_url?: string;
}

interface UserProfile {
  name: string;
}

export default function HomeScreen() {
  const { user } = useAuth();
  const [userName, setUserName] = useState('');
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const carouselRef = useRef(null);

  useEffect(() => {
    if (user) {
      loadUserData();
      loadPets();
    }
  }, [user]);

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

  const renderPetCard = ({ item }: { item: Pet }) => (
    <TouchableOpacity
      style={[
        styles.petChip,
        selectedPet?.id === item.id && styles.petChipSelected,
      ]}
      onPress={() => setSelectedPet(item)}
    >
      <Text
        style={[
          styles.petChipText,
          selectedPet?.id === item.id && styles.petChipTextSelected,
        ]}
      >
        {item.name}
      </Text>
    </TouchableOpacity>
  );

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
          </View>
          <View style={styles.logoContainer}>
            <Ionicons name="paw" size={40} color="#fff" />
          </View>
        </View>

        {/* QUICK MESSAGE INPUT */}
        <View style={styles.quickMessageContainer}>
          <TextInput
            style={styles.quickMessageInput}
            placeholder="your message here..."
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

        {/* PET CARD */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#7B2CBF" />
          </View>
        ) : selectedPet ? (
          // 🎯 TOUCHABLE OPACITY PARA NAVEGAR A DETALLE
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={() =>
              router.push(`/pet-detail/${selectedPet.id}`)

            }
          >
            <View style={styles.petCard}>
              {/* PET PHOTO & NAME */}
              <View style={styles.petHeader}>
                <View style={styles.petPhotoContainer}>
                  {selectedPet.photo_url ? (
                    <Image
                      source={{ uri: selectedPet.photo_url }}
                      style={styles.petPhoto}
                    />
                  ) : (
                    <View style={styles.petPhotoPlaceholder}>
                      <Ionicons
                        name={getPetIcon(selectedPet.type) as any}
                        size={40}
                        color="#7B2CBF"
                      />
                    </View>
                  )}
                </View>

                <View style={styles.petInfo}>
                  <Text style={styles.petName}>{selectedPet.name}</Text>
                  <Text style={styles.petBreed}>{selectedPet.breed || 'Sin raza'}</Text>
                </View>
              </View>

              {/* PET DETAILS */}
              <View style={styles.petDetails}>
                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Age</Text>
                    <Text style={styles.detailValue}>
                      {calculateAge(selectedPet.birthday)}
                    </Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Sex</Text>
                    <Text style={styles.detailValue}>
                      {selectedPet.sex === 'Male' ? 'Male' : selectedPet.sex === 'Female' ? 'Female' : 'Unknown'}
                    </Text>
                  </View>
                </View>

                <View style={styles.detailRow}>
                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{selectedPet.weight} kg</Text>
                  </View>

                  <View style={styles.detailItem}>
                    <Text style={styles.detailLabel}>Owner</Text>
                    <Text style={styles.detailValue} numberOfLines={1}>
                      {userName}
                    </Text>
                  </View>
                </View>
              </View>

              {/* 🆕 INDICADOR DE TAP */}
              <View style={styles.tapToExpandHint}>
                <Ionicons name="expand-outline" size={16} color="#9CA3AF" />
                <Text style={styles.tapToExpandText}>Tap para ver detalles</Text>
              </View>
            </View>
          </TouchableOpacity>
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
    backgroundColor: '#7B2CBF',
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
    borderColor: '#7B2CBF',
    backgroundColor: '#fff',
  },

  petChipSelected: {
    backgroundColor: '#7B2CBF',
  },

  petChipText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7B2CBF',
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

  /* PET CARD */
  petCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 25,
  },

  petPhotoContainer: {
    marginRight: 15,
  },

  petPhoto: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#7B2CBF',
  },

  petPhotoPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#7B2CBF',
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  petBreed: {
    fontSize: 16,
    color: '#6B7280',
  },

  /* PET DETAILS */
  petDetails: {
    gap: 15,
  },

  detailRow: {
    flexDirection: 'row',
    gap: 15,
  },

  detailItem: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
    fontWeight: '500',
  },

  detailValue: {
    fontSize: 16,
    color: '#111827',
    fontWeight: '600',
  },

  /* 🆕 TAP TO EXPAND HINT */
  tapToExpandHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
    gap: 6,
  },

  tapToExpandText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
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

  addFirstPetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* LOADING */
  loadingContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
});