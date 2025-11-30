// components/PremiumModal.tsx

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/contexts/ThemeContext";

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
  const { theme } = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.card, { backgroundColor: theme.colors.background }]}>
          <View style={[styles.header, { backgroundColor: theme.colors.primary }]}>
            <Ionicons name="star" size={32} color={theme.colors.textInverse} />
            <Text style={styles.headerText}>MyVet Premium</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
              Potencia tus herramientas veterinarias y cuida mejor a tus mascotas.
            </Text>

            {/* COMPARACIÓN */}
            <View style={[styles.table, { backgroundColor: theme.colors.primaryLight }]}>
              <View style={[styles.tableHeader, { borderBottomColor: theme.colors.primary + '40' }]}>
                <Text style={[styles.tableTitle, { flex: 1, color: theme.colors.primary }]}>Función</Text>
                <Text style={[styles.tableTitle, { color: theme.colors.primary }]}>Free</Text>
                <Text style={[styles.tableTitle, { color: theme.colors.primary }]}>Premium</Text>
              </View>

              {[
                {
                  label: "Chats con IA al día",
                  free: "2",
                  premium: "Ilimitado",
                },
                {
                  label: "Número de mascotas",
                  free: "2",
                  premium: "Ilimitado",
                },
                {
                  label: "Enviar imágenes a la IA",
                  free: "No",
                  premium: "Sí",
                },
                {
                  label: "Anuncios",
                  free: "Sí",
                  premium: "No",
                },
                {
                  label: "Crear códigos QR",
                  free: "No",
                  premium: "Sí",
                },
              ].map((row, i) => (
                <View key={i} style={[styles.tableRow, { borderBottomColor: theme.colors.primary + '30' }]}>
                  <Text style={[styles.rowLabel, { flex: 1, color: theme.colors.text }]}>{row.label}</Text>

                  <Text style={[styles.rowValueFree, { color: theme.colors.error }]}>{row.free}</Text>
                  <Text style={[styles.rowValuePremium, { color: theme.colors.success }]}>{row.premium}</Text>
                </View>
              ))}
            </View>

            <Text style={[styles.price, { color: theme.colors.text }]}>$14.900 COP / mes</Text>

            <TouchableOpacity
              style={[styles.subscribeBtn, { backgroundColor: theme.colors.primary }]}
              onPress={() => alert("Próximamente disponible")}
            >
              <Text style={styles.subscribeText}>Suscribirme</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={[styles.closeText, { color: theme.colors.textSecondary }]}>Cerrar</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: "flex-end",
  },
  card: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 15,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    paddingVertical: 25,
    alignItems: "center",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
  },
  headerText: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "800",
    marginTop: 6,
  },
  subtitle: {
    textAlign: "center",
    fontSize: 15,
    marginTop: 18,
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  table: {
    width: "92%",
    alignSelf: "center",
    padding: 12,
    borderRadius: 16,
  },
  tableHeader: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    paddingBottom: 6,
  },
  tableTitle: {
    flex: 0.5,
    textAlign: "center",
    fontWeight: "700",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  rowLabel: {
    fontSize: 14,
  },
  rowValueFree: {
    flex: 0.5,
    textAlign: "center",
    fontWeight: "600",
  },
  rowValuePremium: {
    flex: 0.5,
    textAlign: "center",
    fontWeight: "700",
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
  },
  subscribeBtn: {
    marginHorizontal: 30,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  subscribeText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
  closeText: {
    marginTop: 12,
    textAlign: "center",
    fontSize: 15,
    fontWeight: "500",
  },
});
