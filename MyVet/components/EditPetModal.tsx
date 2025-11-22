// components/EditPetModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  photo_url?: string;
}

interface EditPetModalProps {
  visible: boolean;
  pet: Pet;
  onClose: () => void;
  onSave: () => void;
}

export default function EditPetModal({
  visible,
  pet,
  onClose,
  onSave,
}: EditPetModalProps) {
  const [name, setName] = useState(pet.name);
  const [breed, setBreed] = useState(pet.breed);
  const [type, setType] = useState(pet.type);
  const [sex, setSex] = useState(pet.sex);
  const [birthday, setBirthday] = useState(new Date(pet.birthday));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const petTypes = [
    { key: 'dog', icon: 'paw', label: 'Perro' },
    { key: 'cat', icon: 'heart', label: 'Gato' },
    { key: 'bird', icon: 'airplane', label: 'Ave' },
    { key: 'rabbit', icon: 'happy', label: 'Conejo' },
    { key: 'hamster', icon: 'radio-button-on', label: 'Hámster' },
    { key: 'fish', icon: 'water', label: 'Pez' },
    { key: 'turtle', icon: 'shield', label: 'Tortuga' },
    { key: 'other', icon: 'ellipsis-horizontal', label: 'Otro' },
  ];

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Por favor ingresa el nombre de tu mascota');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('pets')
        .update({
          name: name.trim(),
          breed: breed.trim(),
          type,
          sex,
          birthday: birthday.toISOString().split('T')[0],
        })
        .eq('id', pet.id);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Mascota actualizada correctamente');
      onSave();
    } catch (error: any) {
      console.error('Error updating pet:', error);
      Alert.alert('Error', 'No se pudo actualizar la mascota');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Eliminar Mascota',
      `¿Estás seguro de que quieres eliminar a ${pet.name}?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('pets')
                .delete()
                .eq('id', pet.id);

              if (error) throw error;

              Alert.alert('Eliminado', 'Mascota eliminada correctamente');
              onSave();
            } catch (error: any) {
              console.error('Error deleting pet:', error);
              Alert.alert('Error', 'No se pudo eliminar la mascota');
            }
          },
        },
      ]
    );
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setBirthday(selectedDate);
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
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.modalOverlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          {/* HEADER */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color="#111827" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Edit Pet</Text>
            <TouchableOpacity onPress={handleDelete}>
              <Ionicons name="trash-outline" size={24} color="#EF4444" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* PHOTO */}
            {pet.photo_url && (
              <View style={styles.photoContainer}>
                <Image source={{ uri: pet.photo_url }} style={styles.petPhoto} />
              </View>
            )}

            {/* NAME */}
            <Text style={styles.label}>Pet Name *</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Luna"
              value={name}
              onChangeText={setName}
              placeholderTextColor="#9CA3AF"
            />

            {/* TYPE */}
            <Text style={styles.label}>Pet Type *</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.typeScroll}
            >
              {petTypes.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[
                    styles.typeButton,
                    type === t.key && styles.typeButtonActive,
                  ]}
                  onPress={() => setType(t.key)}
                >
                  <Ionicons
                    name={t.icon as any}
                    size={24}
                    color={type === t.key ? '#fff' : '#7B2CBF'}
                  />
                  <Text
                    style={[
                      styles.typeLabel,
                      type === t.key && styles.typeLabelActive,
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* BREED */}
            <Text style={styles.label}>Breed</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Golden Retriever"
              value={breed}
              onChangeText={setBreed}
              placeholderTextColor="#9CA3AF"
            />

            {/* SEX */}
            <Text style={styles.label}>Sex *</Text>
            <View style={styles.sexRow}>
              {['Male', 'Female', 'Unknown'].map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.sexButton, sex === s && styles.sexButtonActive]}
                  onPress={() => setSex(s)}
                >
                  <Text
                    style={[styles.sexText, sex === s && styles.sexTextActive]}
                  >
                    {s === 'Male' ? 'Macho' : s === 'Female' ? 'Hembra' : 'Desconocido'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* BIRTHDAY */}
            <Text style={styles.label}>Birthday *</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.dateText}>{formatDate(birthday)}</Text>
              <Ionicons name="calendar-outline" size={24} color="#7B2CBF" />
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={birthday}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
                maximumDate={new Date()}
                locale="es-ES"
              />
            )}

            {/* SAVE BUTTON */}
            <TouchableOpacity
              style={[styles.saveButton, loading && styles.saveButtonDisabled]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Guardando...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },

  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },

  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },

  modalContent: {
    padding: 20,
  },

  photoContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },

  petPhoto: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#7B2CBF',
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111827',
    backgroundColor: '#fff',
  },

  typeScroll: {
    marginVertical: 8,
  },

  typeButton: {
    width: 80,
    height: 90,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#7B2CBF',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginRight: 12,
    gap: 4,
  },

  typeButtonActive: {
    backgroundColor: '#7B2CBF',
  },

  typeLabel: {
    fontSize: 11,
    color: '#7B2CBF',
    fontWeight: '600',
  },

  typeLabelActive: {
    color: '#fff',
  },

  sexRow: {
    flexDirection: 'row',
    gap: 12,
  },

  sexButton: {
    flex: 1,
    borderWidth: 1.5,
    borderColor: '#7B2CBF',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },

  sexButtonActive: {
    backgroundColor: '#7B2CBF',
  },

  sexText: {
    color: '#7B2CBF',
    fontWeight: '600',
  },

  sexTextActive: {
    color: '#fff',
  },

  dateButton: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  },

  saveButtonDisabled: {
    opacity: 0.6,
  },

  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  cancelButton: {
    padding: 18,
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 20,
  },

  cancelButtonText: {
    color: '#6B7280',
    fontSize: 16,
    fontWeight: '600',
  },
});