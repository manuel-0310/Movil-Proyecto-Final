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

interface PremiumModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function PremiumModal({ visible, onClose }: PremiumModalProps) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Ionicons name="star" size={32} color="#fff" />
            <Text style={styles.headerText}>MyVet Premium</Text>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 20 }}>
            <Text style={styles.subtitle}>
              Potencia tus herramientas veterinarias y cuida mejor a tus mascotas.
            </Text>

            {/* COMPARACIÓN */}
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableTitle, { flex: 1 }]}>Función</Text>
                <Text style={styles.tableTitle}>Free</Text>
                <Text style={styles.tableTitle}>Premium</Text>
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
                <View key={i} style={styles.tableRow}>
                  <Text style={[styles.rowLabel, { flex: 1 }]}>{row.label}</Text>

                  <Text style={styles.rowValueFree}>{row.free}</Text>
                  <Text style={styles.rowValuePremium}>{row.premium}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.price}>$14.900 COP / mes</Text>

            <TouchableOpacity
              style={styles.subscribeBtn}
              onPress={() => alert("Próximamente disponible")}
            >
              <Text style={styles.subscribeText}>Suscribirme</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>Cerrar</Text>
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
    backgroundColor: "rgba(0, 0, 0, 0.43)",
    justifyContent: "flex-end",
  },
  card: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingBottom: 15,
    maxHeight: "85%",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 10,
  },
  header: {
    backgroundColor: "#7B2Cff",
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
    color: "#555",
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  table: {
    width: "92%",
    alignSelf: "center",
    backgroundColor: "#F4ECFF",
    padding: 12,
    borderRadius: 16,
  },
  tableHeader: {
    flexDirection: "row",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#D8C9FF",
    paddingBottom: 6,
  },
  tableTitle: {
    flex: 0.5,
    textAlign: "center",
    fontWeight: "700",
    color: "#7B2CBF",
  },
  tableRow: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#E6DFFF",
  },
  rowLabel: {
    fontSize: 14,
    color: "#333",
  },
  rowValueFree: {
    flex: 0.5,
    textAlign: "center",
    color: "#C53030",
    fontWeight: "600",
  },
  rowValuePremium: {
    flex: 0.5,
    textAlign: "center",
    color: "#2F855A",
    fontWeight: "700",
  },
  price: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 20,
    color: "#111",
  },
  subscribeBtn: {
    backgroundColor: "#7B2Cff",
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
    color: "#777",
    fontSize: 15,
    fontWeight: "500",
  },
});
