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
import DateTimePicker from "@react-native-community/datetimepicker";

interface MedicalRecord {
  id: string;
  title: string;
  date: string;
  description?: string;
  pet_id?: string;
}

interface EditMedicalRecordModalProps {
  visible: boolean;
  record: MedicalRecord;
  onClose: () => void;
  onSave: () => void;
}

export default function EditMedicalRecordModal({
  visible,
  record,
  onClose,
  onSave,
}: EditMedicalRecordModalProps) {
  const [title, setTitle] = useState(record.title);
  const [date, setDate] = useState(new Date(record.date));
  const [description, setDescription] = useState(record.description || "");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const formatDate = (date: Date) =>
    date.toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === "ios");
    if (selectedDate) setDate(selectedDate);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert("Error", "Por favor ingresa un título para el registro");
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from("medical_records")
        .update({
          title: title.trim(),
          date: date.toISOString().split("T")[0],
          description: description.trim() || null,
        })
        .eq("id", record.id);

      if (error) throw error;

      Alert.alert("Éxito", "Registro médico actualizado correctamente");
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
      "Eliminar registro médico",
      `¿Estás seguro de eliminar "${record.title}"?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("medical_records")
                .delete()
                .eq("id", record.id);
              if (error) throw error;
              Alert.alert("Eliminado", "El registro fue eliminado");
              onSave();
              onClose();
            } catch {
              Alert.alert("Error", "No se pudo eliminar el registro");
            }
          },
        },
      ]
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.title}>Editar Registro Médico</Text>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* TÍTULO */}
            <Text style={styles.label}>Título del Registro *</Text>
            <TextInput
              style={styles.input}
              placeholder="ej. Chequeo general, cirugía, tratamiento..."
              value={title}
              onChangeText={setTitle}
              placeholderTextColor="#9CA3AF"
            />

            {/* FECHA */}
            <Text style={styles.label}>Fecha *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(date)}</Text>
              <Ionicons name="calendar-outline" size={24} color="#7B2CBF" />
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

            {/* DESCRIPCIÓN */}
            <Text style={styles.label}>Descripción</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="Describe el motivo de la visita o tratamiento..."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              placeholderTextColor="#9CA3AF"
            />

            {/* BOTONES */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? "Guardando..." : "Guardar Cambios"}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancelar</Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#fff",
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
    borderBottomColor: "#E5E7EB",
  },
  title: { fontSize: 18, fontWeight: "bold", color: "#111827" },
  content: { padding: 20 },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
    marginTop: 16,
  },
  input: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: "#111827",
    backgroundColor: "#fff",
  },
  textArea: { height: 120, textAlignVertical: "top" },
  dateButton: {
    borderWidth: 1.5,
    borderColor: "#D1D5DB",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  dateText: { fontSize: 16, color: "#111827" },
  saveButton: {
    backgroundColor: "#7B2CBF",
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
    color: "#6B7280",
    fontSize: 16,
    fontWeight: "600",
  },
});
