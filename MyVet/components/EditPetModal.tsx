// components/EditPetModal.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Image,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from "react-native";
import { supabase } from "@/utils/supabase";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";
import * as ImagePicker from "expo-image-picker";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  photo_url?: string;
  weight?: number;
}

interface EditPetModalProps {
  visible: boolean;
  pet: Pet;
  onClose: () => void;
  onSave: () => void;
}

export default function EditPetModal({ visible, pet, onClose, onSave }: EditPetModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [type, setType] = useState("dog");
  const [sex, setSex] = useState("Male");
  const [birthday, setBirthday] = useState(new Date());
  const [weight, setWeight] = useState("");
  const [photoUri, setPhotoUri] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Breed lists
  const [dogBreeds, setDogBreeds] = useState<string[]>([]);
  const [catBreeds, setCatBreeds] = useState<string[]>([]);
  const [breedModalVisible, setBreedModalVisible] = useState(false);
  const [breedList, setBreedList] = useState<string[]>([]);

  useEffect(() => {
    fetchDogBreeds();
    fetchCatBreeds();
  }, []);

  // Cuando el tipo cambie y las razas ya estén cargadas, asignamos la lista correcta
  useEffect(() => {
    if (type === "dog") {
      setBreedList(dogBreeds);
    } else if (type === "cat") {
      setBreedList(catBreeds);
    } else {
      setBreedList([]);
    }
  }, [type, dogBreeds, catBreeds]);


  useEffect(() => {
    if (pet) {
      setName(pet.name);
      setBreed(pet.breed);
      setType(pet.type);
      setSex(pet.sex);
      setBirthday(new Date(pet.birthday));
      setWeight(pet.weight ? String(pet.weight) : "");
      setPhotoUri(pet.photo_url || "");
      setPhotoUrl(pet.photo_url || "");
    }
  }, [pet]);

  const fetchDogBreeds = async () => {
    try {
      const res = await fetch("https://api.thedogapi.com/v1/breeds");
      const data = await res.json();
      setDogBreeds(data.map((b: any) => b.name));
    } catch (error) {
      console.log(error);
    }
  };

  const fetchCatBreeds = async () => {
    try {
      const res = await fetch("https://api.thecatapi.com/v1/breeds");
      const data = await res.json();
      setCatBreeds(data.map((b: any) => b.name));
    } catch (error) {
      console.log(error);
    }
  };

  const petTypes = [
    { key: "dog", label: "Perro" },
    { key: "cat", label: "Gato" },
    { key: "bird", label: "Ave" },
    { key: "rabbit", label: "Conejo" },
    { key: "fish", label: "Pez" },
    { key: "other", label: "Otro" },
  ];

  const petIcons: Record<string, { active: any; inactive: any }> = {
    dog: {
      active: require("@/assets/icons/dog_white.png"),
      inactive: require("@/assets/icons/dog_black.png"),
    },
    cat: {
      active: require("@/assets/icons/cat_white.png"),
      inactive: require("@/assets/icons/cat_black.png"),
    },
    bird: {
      active: require("@/assets/icons/bird_white.png"),
      inactive: require("@/assets/icons/bird_black.png"),
    },
    rabbit: {
      active: require("@/assets/icons/rabbit_white.png"),
      inactive: require("@/assets/icons/rabbit_black.png"),
    },
    fish: {
      active: require("@/assets/icons/fish_white.png"),
      inactive: require("@/assets/icons/fish_black.png"),
    },
    other: {
      active: require("@/assets/icons/other_white.png"),
      inactive: require("@/assets/icons/other_black.png"),
    },
  };

  // 📸 Foto
  const selectPhoto = () => {
    Alert.alert("", "Selecciona una opción:", [
      { text: "Cámara", onPress: pickFromCamera },
      { text: "Galería", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const pickFromCamera = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitas dar acceso a la cámara.");
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
      setPhotoUri(result.assets[0].uri);
      await uploadPhoto(base64);
    }
  };

  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso denegado", "Necesitas permitir acceso a fotos.");
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
      setPhotoUri(result.assets[0].uri);
      await uploadPhoto(base64);
    }
  };

  const uploadPhoto = async (base64: string) => {
    try {
      setUploading(true);
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        Alert.alert("Error", "Debes iniciar sesión.");
        return;
      }

      const userId = userData.user.id;
      const fileName = `${userId}-${Date.now()}.jpg`;

      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

      const { error: uploadError } = await supabase.storage
        .from("pet-photos")
        .upload(fileName, bytes, {
          contentType: "image/jpeg",
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from("pet-photos").getPublicUrl(fileName);
      setPhotoUrl(data.publicUrl);
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setUploading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setBirthday(selectedDate);
  };

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", { year: "numeric", month: "long", day: "numeric" });

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de tu mascota");
      return;
    }

    try {
      const { error } = await supabase
        .from("pets")
        .update({
          name,
          type,
          breed,
          sex,
          birthday: birthday.toISOString().split("T")[0],
          photo_url: photoUrl || null,
          weight: weight ? parseFloat(weight) : null,
        })
        .eq("id", pet.id);

      if (error) throw error;

      Alert.alert("¡Éxito!", "Mascota actualizada correctamente");
      onSave();
    } catch (err: any) {
      Alert.alert("Error", "Hubo un error al guardar los cambios: " + err.message);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
          {breedModalVisible && (
        <Modal transparent animationType="fade">
          <View style={[styles.pickerOverlay, { backgroundColor: theme.colors.overlay }]}>
            <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
              <ScrollView>
                {breedList.map((b) => (
                  <TouchableOpacity
                    key={b}
                    onPress={() => {
                      setBreed(b);
                      setBreedModalVisible(false);
                    }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ fontSize: 16, color: theme.colors.text }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{ marginTop: 20 }}
                onPress={() => setBreedModalVisible(false)}
              >
                <Text style={{ textAlign: "center", color: theme.colors.error }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <KeyboardAvoidingView
        style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Editar Mascota</Text>
            <TouchableOpacity
              onPress={() => {
                Alert.alert("Eliminar Mascota", `¿Eliminar a ${pet.name}?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Eliminar",
                    style: "destructive",
                    onPress: async () => {
                      const { error } = await supabase.from("pets").delete().eq("id", pet.id);
                      if (error) Alert.alert("Error", "No se pudo eliminar la mascota");
                      else {
                        Alert.alert("Eliminado", "Mascota eliminada correctamente");
                        onSave();
                      }
                    },
                  },
                ]);
              }}
            >
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 📸 FOTO */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Foto</Text>

            <TouchableOpacity
              onPress={selectPhoto}
              activeOpacity={0.8}
              style={{ alignSelf: "flex-start" }}
            >
              {photoUri ? (
                <View style={styles.photoWrapper}>
                  <Image
                    source={{ uri: photoUri }}
                    style={styles.petPhoto}
                  />
                  <View style={[styles.cameraOverlay, { backgroundColor: theme.colors.primary }]}>
                    <Ionicons name="camera" size={22} color={theme.colors.textInverse} />
                  </View>
                </View>
              ) : (
                <View style={[styles.uploadBtn, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.uploadText}>Subir Foto</Text>
                  <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.textInverse} />
                </View>
              )}
            </TouchableOpacity>

            {/* NOMBRE */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Nombre</Text>
            <TextInput 
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]} 
              value={name} 
              onChangeText={setName}
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* TIPO */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Tipo de Mascota</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {petTypes.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[
                      styles.typeBtn, 
                      { borderColor: theme.colors.border },
                      type === p.key && [styles.typeBtnActive, { backgroundColor: theme.colors.primary }]
                    ]}
                    onPress={() => {
                      setType(p.key);
                      setBreed(""); // limpiar selección previa

                      if (p.key === "dog") {
                        setBreedList(dogBreeds); // usar la lista YA cargada
                      } else if (p.key === "cat") {
                        setBreedList(catBreeds);
                      }
                    }}

                  >
                    <Image
                      source={type === p.key ? petIcons[p.key].active : petIcons[p.key].inactive}
                      style={{
                        width: 32,
                        height: 32,
                        tintColor: type === p.key ? theme.colors.textInverse : theme.colors.primary,
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* RAZA */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Raza</Text>
            <TouchableOpacity
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border
              }]}
              onPress={() => {
                if (type === "dog" || type === "cat") {
                  setBreedList(type === "dog" ? dogBreeds : catBreeds);
                  setBreedModalVisible(true);
                }
              }}
            >
              <Text style={{ color: breed ? theme.colors.text : theme.colors.textTertiary }}>
                {breed || "Seleccionar raza"}
              </Text>
            </TouchableOpacity>

            {/* PESO */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Peso (kg)</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* FECHA */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Fecha de Nacimiento</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <View style={[styles.input, { 
                justifyContent: "center",
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border
              }]}>
                <Text style={{ color: theme.colors.text }}>{formatDate(birthday)}</Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <Modal transparent animationType="fade">
                <TouchableOpacity
                  style={[styles.pickerOverlay, { backgroundColor: theme.colors.overlay }]}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <View style={[styles.pickerContainer, { backgroundColor: theme.colors.card }]}>
                    <DateTimePicker
                      value={birthday}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                      textColor={theme.colors.text}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            )}

            {/* SEXO */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Sexo</Text>
            <View style={styles.sexRow}>
              {["Male", "Female", "Unknown"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[
                    styles.sexBtn, 
                    { borderColor: theme.colors.border },
                    sex === s && [styles.sexBtnActive, { backgroundColor: theme.colors.primary }]
                  ]}
                  onPress={() => setSex(s)}
                >
                  <Text style={[
                    styles.sexText, 
                    { color: theme.colors.text },
                    sex === s && { color: theme.colors.textInverse }
                  ]}>
                    {s === "Male" ? "Macho" : s === "Female" ? "Hembra" : "No lo sé"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BOTÓN GUARDAR */}
            <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.colors.primary }]} onPress={handleSave}>
              <Text style={styles.createText}>Guardar Cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={[styles.cancelText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontSize: 18, fontWeight: "700" },
  modalContent: { padding: 25 },
  pickerOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    padding: 20,
    borderRadius: 16,
    width: "85%",
    maxHeight: "60%",
  },
  label: { fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  uploadBtn: {
    borderRadius: 10,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  uploadText: { color: "#fff", fontWeight: "600", fontSize: 16 },
  typeRow: { flexDirection: "row", marginTop: 10, gap: 12 },
  typeBtn: {
    width: 62,
    height: 62,
    borderRadius: 10,
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  typeBtnActive: { /* Aplicado dinámicamente */ },
  sexRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  sexBtn: {
    borderWidth: 1.5,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sexBtnActive: { /* Aplicado dinámicamente */ },
  sexText: { fontWeight: "600" },
  createBtn: {
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 30,
    alignItems: "center",
  },
  createText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cancelBtn: { padding: 16, alignItems: "center" },
  cancelText: { fontSize: 16, fontWeight: "600" },
  photoWrapper: {
    position: "relative",
    width: 120,
    height: 120,
    marginTop: 10,
  },
  petPhoto: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    borderWidth: 2,
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

});
