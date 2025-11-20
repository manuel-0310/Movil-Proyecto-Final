// app/add-medical-record.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

export default function AddMedicalRecordForm() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [description, setDescription] = useState('');
  const [vetName, setVetName] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Por favor ingresa un título para el registro');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('medical_records').insert([
        {
          pet_id: petId,
          title: title.trim(),
          date: date.toISOString().split('T')[0],
          description: description.trim() || null,
          vet_name: vetName.trim() || null,
          notes: notes.trim() || null,
        },
      ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Registro médico guardado correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error saving medical record:', error);
      Alert.alert('Error', 'No se pudo guardar el registro médico');
    } finally {
      setLoading(false);
    }
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setDate(selectedDate);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nuevo Registro Médico</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* TITLE */}
        <Text style={styles.label}>Título del Registro *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. Chequeo General, Cirugía, Tratamiento"
          value={title}
          onChangeText={setTitle}
          placeholderTextColor="#9CA3AF"
        />

        {/* DATE */}
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
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            maximumDate={new Date()}
            locale="es-ES"
          />
        )}

        {/* DESCRIPTION */}
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

        {/* VET NAME */}
        <Text style={styles.label}>Nombre del Veterinario</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. Dr. García, Dra. Martínez"
          value={vetName}
          onChangeText={setVetName}
          placeholderTextColor="#9CA3AF"
        />

        {/* NOTES */}
        <Text style={styles.label}>Notas Adicionales</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Medicamentos, recomendaciones, próximas citas..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholderTextColor="#9CA3AF"
        />

        {/* INFO BOX */}
        <View style={styles.infoBox}>
          <Ionicons name="information-circle" size={20} color="#7B2CBF" />
          <Text style={styles.infoText}>
            Mantén un registro completo del historial médico de tu mascota para
            consultas futuras y mejores diagnósticos.
          </Text>
        </View>

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Registro'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  header: {
    backgroundColor: '#7B2CBF',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },

  content: {
    flex: 1,
    padding: 24,
  },

  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },

  textArea: {
    height: 120,
    textAlignVertical: 'top',
  },

  dateButton: {
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
  },

  dateText: {
    fontSize: 16,
    color: '#111827',
  },

  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F3E8FF',
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 12,
  },

  infoText: {
    flex: 1,
    fontSize: 14,
    color: '#6B21A8',
    lineHeight: 20,
  },

  saveButton: {
    backgroundColor: '#7B2CBF',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 32,
    marginBottom: 24,
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});