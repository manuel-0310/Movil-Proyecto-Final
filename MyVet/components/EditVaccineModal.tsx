import React, { useState } from "react";
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "@/utils/supabase";
import { useTheme } from "@/contexts/ThemeContext";
import DateTimePicker from "@react-native-community/datetimepicker";

interface Vaccine {
  id: string;
  name: string;
  date: string;
  notes?: string;
  pet_id: string;
}

interface EditVaccineModalProps {
  visible: boolean;
  vaccine: Vaccine;
  onClose: () => void;
  onSave: () => void;
}

export default function EditVaccineModal({
  visible,
  vaccine,
  onClose,
  onSave,
}: EditVaccineModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(vaccine.name);
  const [date, setDate] = useState(new Date(vaccine.date));
  const [notes, setNotes] = useState(vaccine.notes || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Error", "Por favor ingresa el nombre de la vacuna");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("vaccines")
        .update({
          name: name.trim(),
          date: date.toISOString().split("T")[0],
          notes: notes.trim() || null,
        })
        .eq("id", vaccine.id);

      if (error) throw error;

      Alert.alert("Éxito", "Vacuna actualizada correctamente");
      onSave();
      onClose();
    } catch (err: any) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      "Eliminar vacuna",
      `¿Estás seguro de eliminar la vacuna "${vaccine.name}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("vaccines")
                .delete()
                .eq("id", vaccine.id);

              if (error) throw error;

              Alert.alert("Eliminado", "La vacuna ha sido eliminada");
              onSave();
              onClose();
            } catch (error: any) {
              Alert.alert("Error", "No se pudo eliminar la vacuna");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}>
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* HEADER */}
          <View style={[styles.header, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.colors.text }]}>Editar Vacuna</Text>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color={theme.colors.error} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* NOMBRE */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Nombre de la vacuna *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="ej. Rabia, Parvovirus"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* FECHA */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Fecha de aplicación *</Text>
            <TouchableOpacity
              style={[styles.dateButton, { 
                backgroundColor: theme.colors.cardBackground,
                borderColor: theme.colors.border
              }]}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={[styles.dateText, { color: theme.colors.text }]}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={24} color={theme.colors.primary} />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === "ios" ? "spinner" : "default"}
                onChange={onDateChange}
                maximumDate={new Date()}
                locale="es-ES"
              />
            )}

            {/* NOTAS */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Notas</Text>
            <TextInput
              style={[styles.input, styles.textArea, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Agregar notas adicionales..."
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* BOTONES */}
            <TouchableOpacity
              style={[
                styles.saveButton, 
                { backgroundColor: theme.colors.primary },
                loading && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancelar</Text>
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
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "90%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: { fontSize: 18, fontWeight: "bold" },
  content: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: { height: 120, textAlignVertical: "top" },
  dateButton: {
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: { fontSize: 16 },
  saveButton: {
    padding: 18,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 32,
  },
  saveButtonDisabled: { opacity: 0.6 },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  cancelButton: {
    padding: 18,
    alignItems: "center",
    marginTop: 12,
    marginBottom: 20,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
});
