// components/EditProfileModal.tsx
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
} from 'react-native';
import { supabase } from '@/utils/supabase';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  city: string;
}

interface EditProfileModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
  onSave: () => void;
}

export default function EditProfileModal({
  visible,
  profile,
  onClose,
  onSave,
}: EditProfileModalProps) {
  const { theme } = useTheme();
  const [name, setName] = useState(profile.name);
  const [phone, setPhone] = useState(profile.phone);
  const [city, setCity] = useState(profile.city);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!name.trim() || !phone.trim() || !city.trim()) {
      Alert.alert('Error', 'Por favor completa todos los campos');
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from('profiles')
        .update({
          name: name.trim(),
          phone: phone.trim(),
          city: city.trim(),
        })
        .eq('id', profile.id);

      if (error) throw error;

      Alert.alert('¡Éxito!', 'Perfil actualizado correctamente');
      onSave();
    } catch (error: any) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'No se pudo actualizar el perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalOverlay, { backgroundColor: theme.colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
          {/* HEADER */}
          <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={28} color={theme.colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: theme.colors.text }]}>Edit Profile</Text>
            <View style={{ width: 28 }} />
          </View>

          <ScrollView style={styles.modalContent}>
            {/* NAME */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Full Name *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter your name"
              value={name}
              onChangeText={setName}
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* EMAIL (READ ONLY) */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Email</Text>
            <TextInput
              style={[styles.input, styles.inputDisabled, { 
                backgroundColor: theme.colors.backgroundTertiary,
                color: theme.colors.textSecondary,
                borderColor: theme.colors.border
              }]}
              value={profile.email}
              editable={false}
              placeholderTextColor={theme.colors.textTertiary}
            />
            <Text style={[styles.helperText, { color: theme.colors.textSecondary }]}>El email no se puede cambiar</Text>

            {/* PHONE */}
            <Text style={[styles.label, { color: theme.colors.text }]}>Phone Number *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter your phone"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* CITY */}
            <Text style={[styles.label, { color: theme.colors.text }]}>City *</Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: theme.colors.cardBackground,
                color: theme.colors.text,
                borderColor: theme.colors.border
              }]}
              placeholder="Enter your city"
              value={city}
              onChangeText={setCity}
              placeholderTextColor={theme.colors.textTertiary}
            />

            {/* SAVE BUTTON */}
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
                {loading ? 'Guardando...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
              <Text style={[styles.cancelButtonText, { color: theme.colors.textSecondary }]}>Cancel</Text>
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
    justifyContent: 'flex-end',
  },

  modalContainer: {
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
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },

  modalContent: {
    padding: 20,
  },

  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },

  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },

  inputDisabled: {
    // Estilos aplicados dinámicamente
  },

  helperText: {
    fontSize: 12,
    marginTop: 4,
  },

  saveButton: {
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
    fontSize: 16,
    fontWeight: '600',
  },
});