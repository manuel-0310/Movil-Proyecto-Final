import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Link, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";

export default function Login() {
  const router = useRouter();
  const { login } = useContext(AuthContext);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    if (!email || !password) {
      alert("Por favor completa todos los campos");
      return;
    }
    try {
      const data = await login(email, password);
      if (data?.user) router.replace("/(tabs)/home");
    } catch {
      alert("Correo o contraseña incorrectos");
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.logo}>MyVet</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Log In</Text>

          <TextInput
            placeholder="Email"
            style={styles.input}
            placeholderTextColor="#777"
            value={email}
            onChangeText={setEmail}
            selectionColor="#7B2CBF"
            underlineColorAndroid="transparent"
          />
          <TextInput
            placeholder="Password"
            style={styles.input}
            placeholderTextColor="#777"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            selectionColor="#7B2CBF"
            underlineColorAndroid="transparent"
          />

          <TouchableOpacity style={styles.button} onPress={handleLogin}>
            <Text style={styles.buttonText}>Log In</Text>
          </TouchableOpacity>

          <Link href="/reset" style={styles.link}>
            Forgot password?
          </Link>

          <Link href="/register" style={styles.registerLink}>
            Create Account
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
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 20, color: "#222" },
  input: {
    width: "100%",
    borderWidth: 2,
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
  },
  buttonText: { color: "white", fontSize: 18, fontWeight: "600" },
  link: { color: "#7B2CBF", marginTop: 10 },
  registerLink: { color: "#7B2CBF", fontWeight: "bold", marginTop: 20 },
});
