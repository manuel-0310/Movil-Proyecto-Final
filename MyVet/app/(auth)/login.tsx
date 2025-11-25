import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { Link, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { supabase } from "@/utils/supabase";

export default function Login() {
  const router = useRouter();
  const { login } = useContext(AuthContext);
  const { markFirstLogin } = useOnboarding();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Por favor completa todos los campos");
      return;
    }
    
    setIsLoading(true);
    
    try {
      const data = await login(email, password);
      
      if (data?.user) {
        // Verificar si el usuario tiene mascotas registradas
        const { data: pets, error } = await supabase
          .from("pets")
          .select("id")
          .eq("user_id", data.user.id)
          .limit(1);

        if (error) {
          console.error("Error checking pets:", error);
        }

        // Si no tiene mascotas, es su primera vez
        if (!pets || pets.length === 0) {
          await markFirstLogin();
          router.replace("/onboarding/first-pet");
        } else {
          // Ya tiene mascotas, ir directo al home
          router.replace("/(tabs)/home");
        }
      }
    } catch (error) {
      alert("Correo o contraseña incorrectos");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.logo}>MyVet</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>

          <TextInput
            placeholder="Correo electrónico"
            style={styles.input}
            placeholderTextColor="#777"
            value={email}
            onChangeText={setEmail}
            selectionColor="#7B2CBF"
            underlineColorAndroid="transparent"
            editable={!isLoading}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <TextInput
            placeholder="Contraseña"
            style={styles.input}
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            selectionColor="#7B2CBF"
            underlineColorAndroid="transparent"
            editable={!isLoading}
          />

          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]} 
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text style={styles.buttonText}>Iniciar sesión</Text>
            )}
          </TouchableOpacity>

          <Link href="/reset" style={styles.link}>
            ¿Olvidaste tu contraseña?
          </Link>

          <Link href="/register" style={styles.registerLink}>
            Crear cuenta
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#7B2FF7" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 48, fontWeight: "bold", color: "white", marginBottom: 30 },
  card: { width: "85%", backgroundColor: "white", borderRadius: 25, padding: 25, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#222" },
  input: {
    width: "100%",
    borderWidth: 2,
    borderColor: "#7B2FF7",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#7B2FF7",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    minHeight: 50,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  link: { color: "#7B2FF7", marginTop: 10 },
  registerLink: { color: "#7B2FF7", fontWeight: "bold", marginTop: 20 },
});