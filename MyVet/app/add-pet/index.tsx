// app/(tabs)/add-pet/index.tsx
import { useState } from "react";
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    Image,
    Alert,
    Platform,
    ActivityIndicator,
    Modal,
    KeyboardAvoidingView,
} from "react-native";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as FileSystem from 'expo-file-system';

export default function AddPet() {
    const router = useRouter();
    const { completeFirstPetSetup } = useOnboarding();

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [birthday, setBirthday] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sex, setSex] = useState("Male");
    const [type, setType] = useState("dog");
    const [photoUri, setPhotoUri] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [uploading, setUploading] = useState(false);

    const petTypes = [
        { key: "dog", icon: "paw", label: "Perro" },
        { key: "cat", icon: "heart", label: "Gato" },
        { key: "bird", icon: "airplane", label: "Ave" },
        { key: "rabbit", icon: "happy", label: "Conejo" },
        { key: "fish", icon: "water", label: "Pez" },
        { key: "other", icon: "ellipsis-horizontal", label: "Otro" },
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


    // Función para seleccionar foto
    // ---------- FOTO DE MASCOTA ----------
    const selectPhoto = () => {
        Alert.alert(
            "", "",
            [
                { text: "Cámara", onPress: () => pickFromCamera() },
                { text: "Galería", onPress: () => pickFromGallery() },
                { text: "Cancelar", style: "cancel" }
            ]
        );
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

            // Convertir base64 a bytes
            const binary = atob(base64);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            // Subir al bucket "pet-photos"
            const { error: uploadError } = await supabase.storage
                .from("pet-photos")
                .upload(fileName, bytes, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Obtener URL pública
            const { data } = supabase.storage
                .from("pet-photos")
                .getPublicUrl(fileName);

            const publicUrl = data.publicUrl;
            setPhotoUrl(publicUrl);

        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setUploading(false);
        }
    };

    // Manejar cambio de fecha
    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) {
            setBirthday(selectedDate);
        }
    };

    // Formatear fecha para mostrar
    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        });
    };

    const savePet = async () => {
        if (!name.trim()) {
            Alert.alert("Error", "Por favor ingresa el nombre de tu mascota");
            return;
        }

        try {
            const { data: userData } = await supabase.auth.getUser();

            if (!userData || !userData.user) {
                Alert.alert("Error", "Debes iniciar sesión.");
                return;
            }

            const userId = userData.user.id;

            const { error } = await supabase
                .from("pets")
                .insert({
                    user_id: userId,
                    name,
                    type,
                    breed,
                    sex,
                    birthday: birthday.toISOString().split('T')[0], // Formato YYYY-MM-DD
                    photo_url: photoUrl || null,
                });

            if (error) throw error;

            await completeFirstPetSetup();

            Alert.alert("¡Éxito!", "Mascota creada exitosamente", [
                { text: "OK", onPress: () => router.replace("/(tabs)/home") }
            ]);

        } catch (err: any) {
            console.error(err);
            Alert.alert("Error", "Hubo un error al guardar tu mascota: " + err.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            keyboardVerticalOffset={0}
        >
            <ScrollView style={styles.container}>


                <View style={styles.content}>
                    <Text style={styles.title}>Agregar nueva mascota</Text>

                    {/* NAME */}
                    <Text style={styles.label}>Nombre de tu mascota</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ej. Luna"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor="#777"
                    />

                    {/* PHOTO */}
                    <Text style={styles.label}>Foto de Mascota</Text>
                    <TouchableOpacity style={styles.uploadBtn} onPress={selectPhoto}>
                        <Text style={styles.uploadText}>Subir Foto</Text>
                        <Ionicons name="cloud-upload-outline" size={18} color="#fff" />
                    </TouchableOpacity>

                    {photoUri ? (
                        <Image source={{ uri: photoUri }} style={{ width: 120, height: 120, borderRadius: 10, marginTop: 10 }} />
                    ) : null}


                    {/* TYPE */}
                    <Text style={styles.label}>Tipo de Mascota</Text>
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={true}
                        contentContainerStyle={{ paddingVertical: 10 }}
                    >
                        <View style={styles.typeRow}>
                            {petTypes.map((p) => (
                                <TouchableOpacity
                                    key={p.key}
                                    style={[
                                        styles.typeBtn,
                                        type === p.key && styles.typeBtnActive
                                    ]}
                                    onPress={() => setType(p.key)}
                                >
                                    <Image
                                        source={type === p.key ? petIcons[p.key].active : petIcons[p.key].inactive}
                                        style={{ width: 32, height: 32, tintColor: type === p.key ? "#fff" : "#7B2CBF" }}
                                    />
                                </TouchableOpacity>
                            ))}
                        </View>
                    </ScrollView>


                    {/* BREED */}
                    <Text style={styles.label}>Raza</Text>
                    <TextInput
                        style={styles.input}
                        placeholder="ej. Golden Retriever"
                        value={breed}
                        onChangeText={setBreed}
                        placeholderTextColor="#777"
                    />

                    {/* SEX */}
                    <Text style={styles.label}>Sexo</Text>
                    <View style={styles.sexRow}>
                        {["Male", "Female", "Unknown"].map((s) => (
                            <TouchableOpacity
                                key={s}
                                style={[styles.sexBtn, sex === s && styles.sexBtnActive]}
                                onPress={() => setSex(s)}
                            >
                                <Text
                                    style={[
                                        styles.sexText,
                                        sex === s && { color: "#fff" }
                                    ]}
                                >
                                    {s === "Male" ? "Macho" : s === "Female" ? "Hembra" : "Desconocido"}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* BIRTHDAY */}
                    {/* BIRTHDAY */}
                    <Text style={styles.label}>Fecha de Nacimiento</Text>

                    <TouchableOpacity
                        onPress={() => setShowDatePicker(true)}
                        activeOpacity={0.8}
                    >
                        <View style={[styles.input, { justifyContent: "center" }]}>
                            <Text style={{ color: "#000" }}>
                                {formatDate(birthday)}
                            </Text>
                        </View>
                    </TouchableOpacity>

                    {showDatePicker && (
                        <Modal transparent animationType="fade">
                            <TouchableOpacity
                                style={styles.pickerOverlay}
                                activeOpacity={1}
                                onPress={() => setShowDatePicker(false)}
                            >
                                <View style={styles.pickerContainer}>
                                    <DateTimePicker
                                        value={birthday}
                                        mode="date"
                                        display={Platform.OS === "ios" ? "spinner" : "default"}
                                        textColor="#000"
                                        onChange={onDateChange}
                                    />
                                </View>
                            </TouchableOpacity>
                        </Modal>
                    )}



                    {/* SUBMIT */}
                    <TouchableOpacity style={styles.createBtn} onPress={savePet}>
                        <Text style={styles.createText}>Crear Mascota</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: "#FFFFFF" },
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
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },


    content: {
        padding: 25,
    },

    title: {
        fontSize: 28,
        marginTop: 70,
        fontWeight: "700",
        textAlign: "center",
        marginBottom: 25,
        color: "#000",
    },

    label: {
        color: "#000",
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 12,
    },

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

    uploadText: {
        color: "#fff",
        fontWeight: "600",
        fontSize: 16,
    },

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

    typeBtnActive: {
        backgroundColor: "#7B2CBF",
        borderColor: "#7B2CBF",
    },

    sexRow: { flexDirection: "row", gap: 12, marginTop: 10 },

    sexBtn: {
        borderWidth: 1.5,
        borderColor: "#7B2CBF",
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },

    sexBtnActive: {
        backgroundColor: "#7B2CBF",
    },

    sexText: {
        color: "#7B2CBF",
        fontWeight: "600",
    },

    createBtn: {
        backgroundColor: "#7B2CBF",
        borderRadius: 10,
        paddingVertical: 16,
        marginTop: 30,
        alignItems: "center",
    },

    createText: {
        color: "#fff",
        fontSize: 18,
        fontWeight: "700",
    },
});