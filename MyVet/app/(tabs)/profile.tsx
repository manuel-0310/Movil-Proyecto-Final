// app/(tabs)/profile.tsx
import React, { useState, useEffect } from 'react';
import { sendImmediateAINotification } from "@/utils/aiNotifications";
import PremiumModal from "@/components/PremiumModal";

import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Ionicons } from '@expo/vector-icons';
import EditProfileModal from '@/components/EditProfileModal';
import EditPetModal from '@/components/EditPetModal';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
  avatar_url?: string;
}

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  photo_url?: string;
}

export default function ProfileScreen() {
  const { user, logout } = useAuth();
  const { theme, themeMode, setThemeMode, isDark } = useTheme();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [editPetVisible, setEditPetVisible] = useState(false);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [premiumModalVisible, setPremiumModalVisible] = useState(false);

  const toggleTheme = () => {
    if (themeMode === 'light') {
      setThemeMode('dark');
    } else if (themeMode === 'dark') {
      setThemeMode('auto');
    } else {
      setThemeMode('light');
    }
  };
  

  useEffect(() => {
    if (user) {
      loadProfileData();
    }
  }, [user]);

  const loadProfileData = async () => {
    try {
      if (!refreshing) setLoading(true);

      // Cargar perfil del usuario
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Cargar mascotas
      const { data: petsData, error: petsError } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (petsError) throw petsError;
      setPets(petsData || []);
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadProfileData();
  };

  const handleEditPet = (pet: Pet) => {
    setSelectedPet(pet);
    setEditPetVisible(true);
  };

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
  };

  // 📸 Seleccionar fuente de imagen
  const selectProfilePhoto = () => {
    Alert.alert(
      "Cambiar Foto de Perfil",
      "Selecciona una opción:",
      [
        { text: "Cámara", onPress: () => pickFromCamera() },
        { text: "Galería", onPress: () => pickFromGallery() },
        { text: "Cancelar", style: "cancel" },
      ]
    );
  };

  // 📷 Tomar desde cámara
  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Debes permitir acceso a la cámara.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const base64 = result.assets[0].base64!;
      await uploadPhoto(base64);
    }
  };

  // 🖼️ Seleccionar desde galería
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Debes permitir acceso a tus fotos.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      base64: true,
    });

    if (!result.canceled) {
      const base64 = result.assets[0].base64!;
      await uploadPhoto(base64);
    }
  };

  // ☁️ Subir imagen a Supabase
  const uploadPhoto = async (base64: string) => {
    try {
      setUploadingPhoto(true);

      // Obtener usuario actual
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }

      const userId = userData.user.id;
      const fileName = `${userId}-${Date.now()}.jpg`;

      // Convertir base64 → binario
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }

      // Subir imagen al bucket "profile_pic"
      const { error: uploadError } = await supabase.storage
        .from("profile-photos")
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtener URL pública
      const { data } = supabase.storage
        .from("profile-photos")
        .getPublicUrl(fileName);
      const publicUrl = data.publicUrl;

      // Actualizar tabla "profiles"
      const { error: dbError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", userId);

      if (dbError) throw dbError;

      Alert.alert("Éxito", "Foto de perfil actualizada 🎉");
      await loadProfileData(); // Recargar datos
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setUploadingPhoto(false);
    }
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
      <View style={[styles.loadingContainer, { backgroundColor: theme.colors.background }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* HEADER */}
      <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>

        <View style={styles.profilePhotoContainer}>
          <TouchableOpacity onPress={selectProfilePhoto} activeOpacity={0.8}>
            {profile?.avatar_url ? (
              <Image
                source={{ uri: profile.avatar_url }}
                style={styles.profilePhoto}
              />
            ) : (
              <View style={[styles.profilePhotoPlaceholder, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="person" size={50} color={theme.colors.textInverse} />
              </View>
            )}

            {/* CAMERA ICON OVERLAY */}
            <View style={[styles.cameraIconContainer, { backgroundColor: theme.colors.primary }]}>
              {uploadingPhoto ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
        </View>

        <Text style={styles.profileName}>{profile?.name}</Text>
        <Text style={styles.profileEmail}>{profile?.email}</Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* THEME TOGGLE */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Apariencia</Text>
          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
            <TouchableOpacity
              style={styles.themeToggleItem}
              onPress={toggleTheme}
            >
              <View style={styles.themeToggleLeft}>
                <View style={[styles.themeIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                  <Ionicons 
                    name={isDark ? "moon" : "sunny"} 
                    size={20} 
                    color={theme.colors.primary} 
                  />
                </View>
                <View style={styles.themeTextContainer}>
                  <Text style={[styles.themeTitle, { color: theme.colors.text }]}>Tema</Text>
                  <Text style={[styles.themeSubtitle, { color: theme.colors.textSecondary }]}>
                    {themeMode === 'auto' ? 'Automático' : themeMode === 'dark' ? 'Oscuro' : 'Claro'}
                  </Text>
                </View>
              </View>
              <Ionicons 
                name="chevron-forward" 
                size={20} 
                color={theme.colors.textTertiary} 
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* PERSONAL INFORMATION */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Información Personal</Text>

          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="call" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Número de teléfono</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.phone || 'Sin teléfono'}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="location" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Dirección</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>Sin dirección</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={[styles.infoIconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="business" size={20} color={theme.colors.primary} />
              </View>
              <View style={styles.infoTextContainer}>
                <Text style={[styles.infoLabel, { color: theme.colors.textSecondary }]}>Ciudad</Text>
                <Text style={[styles.infoValue, { color: theme.colors.text }]}>{profile?.city || 'Sin ciudad'}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditProfileVisible(true)}
            >
              <Text style={[styles.editButtonText, { color: theme.colors.primary }]}>Editar información personal</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* MY PETS */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>Mis mascotas</Text>

          {pets.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="paw-outline" size={60} color={theme.colors.textTertiary} />
              <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>No tienes mascotas registradas</Text>
              <TouchableOpacity
                style={[styles.addPetButton, { backgroundColor: theme.colors.primary }]}
                onPress={() => router.push('/add-pet')}
              >
                <Text style={styles.addPetButtonText}>Agregar Mascota</Text>
              </TouchableOpacity>
            </View>
          ) : (
            pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.petItem, { backgroundColor: theme.colors.cardBackground }]}
              >
                <View style={styles.petIconContainer}>
                  {pet.photo_url ? (
                    <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
                  ) : (
                    <View style={[styles.petIconPlaceholder, { backgroundColor: theme.colors.primaryLight, borderColor: theme.colors.primary }]}>
                      <Ionicons name={getPetIcon(pet.type)} size={24} color={theme.colors.primary} />
                    </View>
                  )}
                </View>

                <View style={styles.petInfo}>
                  <Text style={[styles.petName, { color: theme.colors.text }]}>{pet.name}</Text>
                  <Text style={[styles.petBreed, { color: theme.colors.textSecondary }]}>{pet.breed || 'Sin raza'}</Text>
                </View>

                <TouchableOpacity
                  onPress={() => handleEditPet(pet)}
                >
                  <Text style={[styles.viewProfileText, { color: theme.colors.primary }]}>Editar mascota</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            ))
          )}
        </View>

        <TouchableOpacity
          onPress={sendImmediateAINotification}
          style={[styles.aiButton, { backgroundColor: theme.colors.primary }]}
        >
          <Ionicons name="sparkles-outline" size={20} color="#FFF" />
          <Text style={styles.aiButtonText}>Enviar notificación</Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setPremiumModalVisible(true)}
          style={[styles.aiButton, { backgroundColor: theme.colors.primary }]}
        >
  <Text style={{ color: "#ffffff", fontSize: 16, fontWeight: "700" }}>
    ⭐ Quiero ser Premium
  </Text>
</TouchableOpacity>





        {/* LOGOUT */}
        <TouchableOpacity 
          style={[styles.logoutButton, { 
            borderColor: theme.colors.error + '30',
            backgroundColor: theme.colors.error + '10'
          }]} 
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color={theme.colors.error} />
          <Text style={[styles.logoutText, { color: theme.colors.error }]}>Cerrar Sesión</Text>
        </TouchableOpacity>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* MODALS */}
      {profile && (
        <EditProfileModal
          visible={editProfileVisible}
          profile={profile}
          onClose={() => setEditProfileVisible(false)}
          onSave={() => {
            setEditProfileVisible(false);
            loadProfileData();
          }}
        />
      )}
      <PremiumModal
  visible={premiumModalVisible}
  onClose={() => setPremiumModalVisible(false)}
/>


      {selectedPet && (
        <EditPetModal
          visible={editPetVisible}
          pet={selectedPet}
          onClose={() => {
            setEditPetVisible(false);
            setSelectedPet(null);
          }}
          onSave={() => {
            setEditPetVisible(false);
            setSelectedPet(null);
            loadProfileData();
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* HEADER */
  header: {
    paddingTop: 80,
    paddingBottom: 30,
    alignItems: 'center',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  logoContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
  },

  profilePhotoContainer: {
    marginBottom: 16,
    position: 'relative',
  },

  profilePhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
  },

  profilePhotoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },

  cameraIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#fff',
  },
  aiButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#7B2FF7",
    paddingVertical: 14,
    borderRadius: 14,
    marginBottom: 20,
    marginHorizontal: 20,
    gap: 8,
  },
  aiButtonText: {
    color: "#FFF",
    fontSize: 16,
    fontWeight: "600",
  },

  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 4,
  },

  profileEmail: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
  },

  /* SECTIONS */
  section: {
    padding: 20,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },

  /* INFO CARD */
  infoCard: {
    borderRadius: 16,
    padding: 16,
  },

  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },

  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  infoTextContainer: {
    flex: 1,
  },

  infoLabel: {
    fontSize: 12,
    marginBottom: 2,
  },

  infoValue: {
    fontSize: 16,
    fontWeight: '500',
  },

  editButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },

  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* THEME TOGGLE */
  themeToggleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },

  themeToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },

  themeIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },

  themeTextContainer: {
    flex: 1,
  },

  themeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },

  themeSubtitle: {
    fontSize: 14,
  },

  /* PET ITEMS */
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  petIconContainer: {
    marginRight: 12,
  },

  petPhoto: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
  },

  petIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
  },

  petInfo: {
    flex: 1,
  },

  petName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },

  petBreed: {
    fontSize: 14,
  },

  viewProfileText: {
    fontSize: 14,
    fontWeight: '600',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },

  emptyText: {
    fontSize: 16,
    marginTop: 16,
    marginBottom: 24,
  },

  addPetButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 20,
  },

  addPetButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  /* LOGOUT */
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 20,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },

  logoutText: {
    fontSize: 16,
    fontWeight: '600',
  },
});