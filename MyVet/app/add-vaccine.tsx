// app/add-vaccine.tsx
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

export default function AddVaccineForm() {
  const { petId } = useLocalSearchParams<{ petId: string }>();
  const [name, setName] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de la vacuna');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase.from('vaccines').insert([
        {
          pet_id: petId,
          name: name.trim(),
          date: date.toISOString().split('T')[0],
          notes: notes.trim() || null,
        },
      ]);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Vacuna registrada correctamente', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Error saving vaccine:', error);
      Alert.alert('Error', 'No se pudo guardar la vacuna');
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
        <Text style={styles.headerTitle}>Nueva Vacuna</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content}>
        {/* VACCINE NAME */}
        <Text style={styles.label}>Nombre de la Vacuna *</Text>
        <TextInput
          style={styles.input}
          placeholder="ej. Rabia, Parvovirus, Triple Felina"
          value={name}
          onChangeText={setName}
          placeholderTextColor="#9CA3AF"
        />

        {/* DATE */}
        <Text style={styles.label}>Fecha de Aplicación *</Text>
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

        {/* NOTES */}
        <Text style={styles.label}>Notas (Opcional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Agregar notas adicionales..."
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={4}
          placeholderTextColor="#9CA3AF"
        />

        

        {/* SAVE BUTTON */}
        <TouchableOpacity
          style={[styles.saveButton, loading && styles.saveButtonDisabled]}
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? 'Guardando...' : 'Guardar Vacuna'}
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
    fontSize: 20,
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