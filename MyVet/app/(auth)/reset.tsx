import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Link, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function Reset() {
  const router = useRouter();
  const { resetPassword } = useContext(AuthContext);

  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) {
      alert("Por favor ingresa tu correo electrónico");
      return;
    }

    try {
      await resetPassword(email);
      alert("✅ Se ha enviado un correo para restablecer tu contraseña. Revisa tu bandeja de entrada.");
      router.push("/login");
    } catch (error: any) {
      alert(`❌ Error: ${error.message || "No se pudo enviar el correo"}`);
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.logo}>MyVet</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.description}>
            Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
          </Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor="#777"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            selectionColor="#7B2CBF"
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity style={styles.button} onPress={handleReset}>
            <Text style={styles.buttonText}>Send Reset Link</Text>
          </TouchableOpacity>

          <Link href="/login" style={styles.link}>
            Back to Login
          </Link>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: "#7B2CBF" },
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  logo: { fontSize: 48, fontWeight: "bold", color: "white", marginBottom: 30 },
  card: { width: "85%", backgroundColor: "white", borderRadius: 25, padding: 25, alignItems: "center" },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 10, color: "#222" },
  description: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  input: {
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#7B2CBF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#7B2CBF",
    paddingVertical: 15,
    borderRadius: 10,
    width: "100%",
    alignItems: "center",
    marginTop: 10,
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  link: { color: "#7B2CBF", marginTop: 20, fontWeight: "bold" },
});

