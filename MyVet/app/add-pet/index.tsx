import { useState, useEffect } from "react";
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
    Modal,
    KeyboardAvoidingView,
} from "react-native";
import { supabase } from "@/utils/supabase";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { useTheme } from "@/contexts/ThemeContext";
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function AddPet() {
    const insets = useSafeAreaInsets();
    const router = useRouter();
    const { completeFirstPetSetup } = useOnboarding();
    const { theme } = useTheme();

    const [name, setName] = useState("");
    const [breed, setBreed] = useState("");
    const [birthday, setBirthday] = useState(new Date());
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [sex, setSex] = useState("Male");
    const [type, setType] = useState("dog");
    const [photoUri, setPhotoUri] = useState("");
    const [photoUrl, setPhotoUrl] = useState("");
    const [uploading, setUploading] = useState(false);
    const [weight, setWeight] = useState(""); // Nuevo campo para peso

    const [dogBreeds, setDogBreeds] = useState<string[]>([]);
    const [catBreeds, setCatBreeds] = useState<string[]>([]);
    const [breedModalVisible, setBreedModalVisible] = useState(false);
    const [breedList, setBreedList] = useState<string[]>([]);

    const fetchDogBreeds = async () => {
        try {
            const res = await fetch("https://api.thedogapi.com/v1/breeds");
            const data = await res.json();
    
            const list = data.map((b: any) => b.name);
    
            setDogBreeds(list); 
            setBreedList(list);   
        } catch (error) {
            console.log(error);
        }
    };
    
    useEffect(() => {
        fetchDogBreeds();
        }, []);

    const fetchCatBreeds = async () => {
        try {
            const res = await fetch("https://api.thecatapi.com/v1/breeds");
            const data = await res.json();
    
            const list = data.map((b: any) => b.name);
    
            setCatBreeds(list);
            setBreedList(list);
        } catch (error) {
            console.log(error);
        }
    };
    
    

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

    const selectPhoto = () => {
        Alert.alert("", "", [
            { text: "Cámara", onPress: () => pickFromCamera() },
            { text: "Galería", onPress: () => pickFromGallery() },
            { text: "Cancelar", style: "cancel" }
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
            for (let i = 0; i < binary.length; i++) {
                bytes[i] = binary.charCodeAt(i);
            }

            const { error: uploadError } = await supabase.storage
                .from("pet-photos")
                .upload(fileName, bytes, {
                    contentType: "image/jpeg",
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from("pet-photos")
                .getPublicUrl(fileName);

            setPhotoUrl(data.publicUrl);

        } catch (err: any) {
            Alert.alert("Error", err.message);
        } finally {
            setUploading(false);
        }
    };

    const onDateChange = (event: any, selectedDate?: Date) => {
        setShowDatePicker(Platform.OS === 'ios');
        if (selectedDate) setBirthday(selectedDate);
    };

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
                    birthday: birthday.toISOString().split('T')[0],
                    photo_url: photoUrl || null,
                    weight: weight ? parseFloat(weight) : null,
                });

            if (error) throw error;

            await completeFirstPetSetup();

            Alert.alert("¡Éxito!", "Mascota creada exitosamente", [
                { text: "OK", onPress: () => router.replace("/(tabs)/home") }
            ]);

        } catch (err: any) {
            Alert.alert("Error", "Hubo un error al guardar tu mascota: " + err.message);
        }
    };

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
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
                                <Text style={{ textAlign: "center", color: theme.colors.error }}>
                                    Cerrar
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </Modal>
            )}

            <View style={[styles.header, { paddingTop: insets.top + 10, backgroundColor: theme.colors.background }]}>
                <TouchableOpacity
                    style={[styles.exitBtn, { backgroundColor: theme.colors.primary }]}
                    onPress={() => router.replace("/(tabs)/home")}
                >
                    <Ionicons name="arrow-back-outline" size={20} color={theme.colors.textInverse} />
                </TouchableOpacity>
                <Text style={[styles.title, { color: theme.colors.text }]}>Agregar nueva mascota</Text>
            </View>

            <ScrollView style={[styles.container, { backgroundColor: theme.colors.background }]}>
                <View style={styles.content}>

                    {/* NOMBRE */}
                    <Text style={[styles.label, { color: theme.colors.text }]}>Nombre de tu mascota</Text>
                    <TextInput
                        style={[styles.input, { 
                            backgroundColor: theme.colors.cardBackground,
                            color: theme.colors.text,
                            borderColor: theme.colors.border
                        }]}
                        placeholder="ej. Luna"
                        value={name}
                        onChangeText={setName}
                        placeholderTextColor={theme.colors.textTertiary}
                    />

                    {/* FOTO */}
                    <Text style={[styles.label, { color: theme.colors.text }]}>Foto de Mascota</Text>
                    {photoUri ? (
                        <Image
                            source={{ uri: photoUri }}
                            style={{ width: 120, height: 120, borderRadius: 10, marginTop: 10 }}
                        />
                    ) : (
                        <TouchableOpacity style={[styles.uploadBtn, { backgroundColor: theme.colors.primary }]} onPress={selectPhoto}>
                            <Text style={styles.uploadText}>Subir Foto</Text>
                            <Ionicons name="cloud-upload-outline" size={18} color={theme.colors.textInverse} />
                        </TouchableOpacity>
                    )}



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
                                        setBreed("");
                                    
                                        if (p.key === "dog") fetchDogBreeds();
                                        if (p.key === "cat") fetchCatBreeds();
                                    }}
                                    
                                >
                                    <Image
                                        source={type === p.key ? petIcons[p.key].active : petIcons[p.key].inactive}
                                        style={{
                                            width: 32,
                                            height: 32,
                                            tintColor: type === p.key ? theme.colors.textInverse : theme.colors.primary
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
                        placeholder="ej. 12.5"
                        value={weight}
                        onChangeText={(text) => setWeight(text.replace(/[^0-9.]/g, ''))}
                        keyboardType="decimal-pad"
                        placeholderTextColor={theme.colors.textTertiary}
                    />
                    {/* FECHA DE NACIMIENTO */}
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
                                    {Platform.OS === "ios" ? (
                                        <View style={{ backgroundColor: theme.colors.card, borderRadius: 10 }}>
                                            <DateTimePicker
                                                value={birthday}
                                                mode="date"
                                                display="spinner"
                                                onChange={onDateChange}
                                                textColor={theme.colors.text}
                                            />
                                        </View>
                                    ) : (
                                        <DateTimePicker
                                            value={birthday}
                                            mode="date"
                                            display="default"
                                            onChange={onDateChange}
                                        />
                                    )}
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

                    {/* BOTÓN CREAR */}
                    <TouchableOpacity style={[styles.createBtn, { backgroundColor: theme.colors.primary }]} onPress={savePet}>
                        <Text style={styles.createText}>Crear Mascota</Text>
                    </TouchableOpacity>

                </View>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    pickerOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        gap: 15,
        paddingHorizontal: 20,
        marginBottom: 0,
    },
    pickerContainer: {
        alignItems: "center",
        padding: 20,
        borderRadius: 16,
        width: "85%",
        height: "30%",
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowRadius: 8,
        elevation: 5,
    },
    content: { padding: 25 },
    exitBtn: {
        padding: 10,
        borderRadius: 30,
        width: 42,
        height: 42,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        flex: 1,
        fontSize: 24,
        fontWeight: "700",
    },
    label: {
        fontWeight: "600",
        marginBottom: 6,
        marginTop: 12,
    },
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
        justifyContent: "center",
        alignItems: "center",
    },
    typeBtnActive: {
        // Estilos aplicados dinámicamente
    },
    sexRow: { flexDirection: "row", gap: 12, marginTop: 10 },
    sexBtn: {
        borderWidth: 1.5,
        paddingVertical: 10,
        paddingHorizontal: 20,
        borderRadius: 10,
    },
    sexBtnActive: {
        // Estilos aplicados dinámicamente
    },
    sexText: {
        fontWeight: "600",
    },
    createBtn: {
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
