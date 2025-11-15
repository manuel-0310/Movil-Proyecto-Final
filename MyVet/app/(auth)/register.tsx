import { useState, useContext } from "react";
import { AuthContext } from "@/contexts/AuthContext";
import { Link, useRouter } from "expo-router";
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Register() {
  const router = useRouter();
  const { register } = useContext(AuthContext);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleRegister = async () => {
    if (!name || !email || !phone || !city || !password || !confirmPassword) {
      alert("Por favor completa todos los campos");
      return;
    }

    if (password !== confirmPassword) {
      alert("Las contraseñas no coinciden");
      return;
    }

    try {
      await register(email, password, name, phone, city);
      alert("✅ Cuenta creada, revisa tu correo para confirmar.");
      router.push("/login");
    } catch {
      alert("❌ Error al crear la cuenta");
    }
  };

  return (
    <View style={styles.background}>
      <View style={styles.container}>
        <Text style={styles.logo}>MyVet</Text>

        <View style={styles.card}>
          <Text style={styles.title}>Create Account</Text>

          <TextInput placeholder="Name" style={styles.input} placeholderTextColor="#777" value={name} onChangeText={setName} selectionColor="#7B2CBF" underlineColorAndroid="transparent" />
          <TextInput placeholder="Email" style={styles.input} placeholderTextColor="#777" value={email} onChangeText={setEmail} keyboardType="email-address" selectionColor="#7B2CBF" underlineColorAndroid="transparent" />
          <TextInput placeholder="Phone number" style={styles.input} placeholderTextColor="#777" value={phone} onChangeText={setPhone} keyboardType="phone-pad" selectionColor="#7B2CBF" underlineColorAndroid="transparent" />
          <TextInput placeholder="City" style={styles.input} placeholderTextColor="#777" value={city} onChangeText={setCity} selectionColor="#7B2CBF" underlineColorAndroid="transparent" />
          
          <View style={styles.passwordContainer}>
            <TextInput 
              placeholder="Password" 
              style={styles.passwordInput} 
              placeholderTextColor="#777"
              value={password} 
              onChangeText={setPassword} 
              secureTextEntry={!showPassword}
              selectionColor="#7B2CBF"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity 
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showPassword ? "eye-off" : "eye"} 
                size={24} 
                color="#7B2CBF" 
              />
            </TouchableOpacity>
          </View>

          <View style={styles.passwordContainer}>
            <TextInput 
              placeholder="Confirm Password" 
              style={styles.passwordInput} 
              placeholderTextColor="#777"
              value={confirmPassword} 
              onChangeText={setConfirmPassword} 
              secureTextEntry={!showConfirmPassword}
              selectionColor="#7B2CBF"
              underlineColorAndroid="transparent"
            />
            <TouchableOpacity 
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              style={styles.eyeIcon}
            >
              <Ionicons 
                name={showConfirmPassword ? "eye-off" : "eye"} 
                size={24} 
                color="#7B2CBF" 
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.button} onPress={handleRegister}>
            <Text style={styles.buttonText}>Register</Text>
          </TouchableOpacity>

          <Link href="/reset" style={styles.link}>
            Forgot password?
          </Link>

          <Text style={styles.footerText}>
            Already have an account?{" "}
            <Link href="/login" style={styles.footerLink}>
              Log in
            </Link>
          </Text>
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
    borderWidth: 1.5,
    borderColor: "#7B2CBF",
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
    fontSize: 16,
  },
  passwordContainer: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: "#7B2CBF",
    borderRadius: 10,
    marginBottom: 15,
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontSize: 16,
  },
  eyeIcon: {
    padding: 12,
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
  footerText: { marginTop: 20, color: "#333" },
  footerLink: { color: "#7B2CBF", fontWeight: "bold" },
});
