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
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
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
                    <Text style={{ fontSize: 16 }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <TouchableOpacity
                style={{ marginTop: 20 }}
                onPress={() => setBreedModalVisible(false)}
              >
                <Text style={{ textAlign: "center", color: "red" }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Editar Mascota</Text>
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
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 📸 FOTO */}
            <Text style={styles.label}>Foto</Text>

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
                  <View style={styles.cameraOverlay}>
                    <Ionicons name="camera" size={22} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={styles.uploadBtn}>
                  <Text style={styles.uploadText}>Subir Foto</Text>
                  <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                </View>
              )}
            </TouchableOpacity>

            {/* NOMBRE */}
            <Text style={styles.label}>Nombre</Text>
            <TextInput style={styles.input} value={name} onChangeText={setName} />

            {/* TIPO */}
            <Text style={styles.label}>Tipo de Mascota</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              <View style={styles.typeRow}>
                {petTypes.map((p) => (
                  <TouchableOpacity
                    key={p.key}
                    style={[styles.typeBtn, type === p.key && styles.typeBtnActive]}
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
                        tintColor: type === p.key ? "#fff" : "#7B2CBF",
                      }}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            {/* RAZA */}
            <Text style={styles.label}>Raza</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                if (type === "dog" || type === "cat") {
                  setBreedList(type === "dog" ? dogBreeds : catBreeds);
                  setBreedModalVisible(true);
                }
              }}
            >
              <Text style={{ color: breed ? "#000" : "#777" }}>
                {breed || "Seleccionar raza"}
              </Text>
            </TouchableOpacity>

            {/* PESO */}
            <Text style={styles.label}>Peso (kg)</Text>
            <TextInput
              style={styles.input}
              value={weight}
              onChangeText={(t) => setWeight(t.replace(/[^0-9.]/g, ""))}
              keyboardType="decimal-pad"
            />

            {/* FECHA */}
            <Text style={styles.label}>Fecha de Nacimiento</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <View style={[styles.input, { justifyContent: "center" }]}>
                <Text style={{ color: "#000" }}>{formatDate(birthday)}</Text>
              </View>
            </TouchableOpacity>

            {showDatePicker && (
              <Modal transparent animationType="fade">
                <TouchableOpacity
                  style={styles.pickerOverlay}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <View style={[styles.pickerContainer, { backgroundColor: "#fff" }]}>
                    <DateTimePicker
                      value={birthday}
                      mode="date"
                      display={Platform.OS === "ios" ? "spinner" : "default"}
                      onChange={onDateChange}
                    />
                  </View>
                </TouchableOpacity>
              </Modal>
            )}

            {/* SEXO */}
            <Text style={styles.label}>Sexo</Text>
            <View style={styles.sexRow}>
              {["Male", "Female", "Unknown"].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sexBtn, sex === s && styles.sexBtnActive]}
                  onPress={() => setSex(s)}
                >
                  <Text style={[styles.sexText, sex === s && { color: "#fff" }]}>
                    {s === "Male" ? "Macho" : s === "Female" ? "Hembra" : "No lo sé"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BOTÓN GUARDAR */}
            <TouchableOpacity style={styles.createBtn} onPress={handleSave}>
              <Text style={styles.createText}>Guardar Cambios</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancelar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalContainer: {
    backgroundColor: "#fff",
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
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: "#111827" },
  modalContent: { padding: 25 },
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  pickerContainer: {
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 16,
    width: "85%",
    maxHeight: "60%",
  },
  label: { color: "#000", fontWeight: "600", marginBottom: 6, marginTop: 12 },
  input: {
    borderWidth: 1.5,
    borderColor: "#7B2CBF",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  uploadBtn: {
    backgroundColor: "#7B2CBF",
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
    borderColor: "#7B2CBF",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  typeBtnActive: { backgroundColor: "#7B2CBF", borderColor: "#7B2CBF" },
  sexRow: { flexDirection: "row", gap: 12, marginTop: 10 },
  sexBtn: {
    borderWidth: 1.5,
    borderColor: "#7B2CBF",
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
  },
  sexBtnActive: { backgroundColor: "#7B2CBF" },
  sexText: { color: "#7B2CBF", fontWeight: "600" },
  createBtn: {
    backgroundColor: "#7B2CBF",
    borderRadius: 10,
    paddingVertical: 16,
    marginTop: 30,
    alignItems: "center",
  },
  createText: { color: "#fff", fontSize: 18, fontWeight: "700" },
  cancelBtn: { padding: 16, alignItems: "center" },
  cancelText: { color: "#6B7280", fontSize: 16, fontWeight: "600" },
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
    borderColor: "#7B2CBF",
  },
  cameraOverlay: {
    position: "absolute",
    bottom: 6,
    right: 6,
    backgroundColor: "#7B2CBF",
    borderRadius: 18,
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#fff",
  },

});
