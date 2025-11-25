import { useState, useContext, useEffect } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Link, useRouter } from "expo-router";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const router = useRouter();
  const { register } = useContext(AuthContext);
  const { markFirstLogin } = useOnboarding();

  // Campos formulario
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Mostrar contraseña
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [isLoading, setIsLoading] = useState(false);

  // Ciudades
  const [cities, setCities] = useState<string[]>([]);
  const [cityFilter, setCityFilter] = useState("");
  const [cityModalVisible, setCityModalVisible] = useState(false);

  // Lista filtrada
  const filteredCities = cities.filter((c) =>
    c.toLowerCase().includes(cityFilter.toLowerCase())
  );

  // ---- Fetch ciudades Colombia ----
  const fetchCities = async () => {
    try {
      const res = await fetch(
        "https://raw.githubusercontent.com/marcovega/colombia-json/master/colombia.json"
      );
      const data = await res.json();

      // Aplana las ciudades por departamento
      const allCities = data.flatMap((d: any) =>
        d.ciudades.map((c: string) => `${c} (${d.departamento})`)
      );

      setCities(allCities);
    } catch (error) {
      console.log("Error cargando ciudades:", error);
    }
  };

  useEffect(() => {
    fetchCities();
  }, []);

  // ----- Register -----
  const handleRegister = async () => {
    if (!name || !email || !phone || !city || !password || !confirmPassword) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    if (password.length < 6) {
      alert("La contraseña debe tener al menos 6 caracteres");
      return;
    }

    setIsLoading(true);

    try {
      const data = await register(email, password, name, phone, city);

      if (data?.user) {
        await markFirstLogin();
        alert("✅ Cuenta creada exitosamente!");
        router.replace("/onboarding/first-pet");
      } else {
        alert("Cuenta creada, revisa tu correo para confirmar.");
        router.push("/login");
      }
    } catch (error: any) {
      alert("❌ Error al crear la cuenta: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* ---------- MODAL CIUDADES ---------- */}
      {cityModalVisible && (
        <Modal transparent animationType="fade">
          <View style={styles.pickerOverlay}>
            <View style={[styles.pickerContainer, { height: "80%" }]}>
              {/* Search */}
              <TextInput
                placeholder="Buscar ciudad..."
                placeholderTextColor="#777"
                value={cityFilter}
                onChangeText={setCityFilter}
                style={styles.searchInput}
              />

              <ScrollView>
                {filteredCities.map((c, index) => (
                  <TouchableOpacity
                    key={`${c}-${index}`}
                    onPress={() => {
                      setCity(c);
                      setCityFilter("");
                      setCityModalVisible(false);
                    }}
                    style={{ paddingVertical: 10 }}
                  >
                    <Text style={{ fontSize: 16 }}>{c}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              <TouchableOpacity
                style={{ marginTop: 20 }}
                onPress={() => setCityModalVisible(false)}
              >
                <Text style={{ textAlign: "center", color: "red" }}>Cerrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}

      {/* ---------- UI GENERAL ---------- */}
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.background}>
          <View style={styles.container}>
            <Text style={styles.logo}>MyVet</Text>

            <View style={styles.card}>
              <Text style={styles.title}>Crear cuenta</Text>

              {/* Nombre */}
              <TextInput
                placeholder="Nombre completo"
                style={styles.input}
                placeholderTextColor="#777"
                value={name}
                onChangeText={setName}
                selectionColor="#7B2CBF"
                editable={!isLoading}
              />

              {/* Email */}
              <TextInput
                placeholder="Correo electrónico"
                style={styles.input}
                placeholderTextColor="#777"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor="#7B2CBF"
                editable={!isLoading}
              />

              {/* Phone */}
              <TextInput
                placeholder="Número de teléfono"
                style={styles.input}
                placeholderTextColor="#777"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
                selectionColor="#7B2CBF"
                editable={!isLoading}
              />

              {/* --------- SELECTOR CIUDAD --------- */}
              <TouchableOpacity
                style={styles.input}
                onPress={() => setCityModalVisible(true)}
              >
                <Text style={{ color: city ? "#000" : "#777" }}>
                  {city || "Selecciona una ciudad"}
                </Text>
              </TouchableOpacity>

              {/* Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Contraseña"
                  style={styles.passwordInput}
                  placeholderTextColor="#777"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  selectionColor="#7B2CBF"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#7B2CBF"
                  />
                </TouchableOpacity>
              </View>

              {/* Confirm Password */}
              <View style={styles.passwordContainer}>
                <TextInput
                  placeholder="Confirmar contraseña"
                  style={styles.passwordInput}
                  placeholderTextColor="#777"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  selectionColor="#7B2CBF"
                  editable={!isLoading}
                />
                <TouchableOpacity
                  onPress={() =>
                    setShowConfirmPassword(!showConfirmPassword)
                  }
                  style={styles.eyeIcon}
                  disabled={isLoading}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={24}
                    color="#7B2CBF"
                  />
                </TouchableOpacity>
              </View>

              {/* Botón */}
              <TouchableOpacity
                style={[styles.button, isLoading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="white" />
                ) : (
                  <Text style={styles.buttonText}>Registrarse</Text>
                )}
              </TouchableOpacity>

              <Text style={styles.footerText}>
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" style={styles.footerLink}>
                  Inicia sesión
                </Link>
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ----------- Styles -----------
const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#7B2FF7" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 48, fontWeight: "bold", color: "white", marginBottom: 30 },
  card: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 25,
    padding: 25,
    alignItems: "center",
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#222" },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#7B2FF7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  searchInput: {
    borderWidth: 1,
    borderColor: "#7B2CBF",
    padding: 10,
    borderRadius: 8,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#7B2FF7",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: { flex: 1, padding: 12, fontSize: 16 },
  eyeIcon: { padding: 12 },
  button: {
    backgroundColor: "#7B2FF7",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  footerText: { marginTop: 20, color: "#333" },
  footerLink: { color: "#7B2FF7", fontWeight: "bold" },

  // Modal
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
});
