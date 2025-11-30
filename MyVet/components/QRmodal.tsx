// components/QRModal.tsx
import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface QRModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRModal({ visible, onClose }: QRModalProps) {
  const { theme } = useTheme();
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={[styles.overlay, { backgroundColor: theme.colors.overlay }]}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={[styles.modalContent, { backgroundColor: theme.colors.background }]}
          >
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.colors.text }]}>Smart QR</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.description, { color: theme.colors.textSecondary }]}>
              Gestiona los códigos QR de tus mascotas para que puedan ser
              identificadas fácilmente si se pierden.
            </Text>

            {/* OPCIÓN 1: CREAR QR */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={() => {
                onClose();
                router.push('../qr/create');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="qr-code" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Crear QR</Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  Genera un código QR para tu mascota
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </TouchableOpacity>

            {/* OPCIÓN 2: ESCANEAR QR */}
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: theme.colors.cardBackground }]}
              onPress={() => {
                onClose();
                router.push('../qr/scan');
              }}
            >
              <View style={[styles.iconContainer, { backgroundColor: theme.colors.primaryLight }]}>
                <Ionicons name="scan" size={32} color={theme.colors.primary} />
              </View>
              <View style={styles.optionInfo}>
                <Text style={[styles.optionTitle, { color: theme.colors.text }]}>Escanear QR</Text>
                <Text style={[styles.optionDescription, { color: theme.colors.textSecondary }]}>
                  Lee la información de un código QR
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.colors.textTertiary} />
            </TouchableOpacity>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: width - 48,
    maxWidth: 400,
  },

  modalContent: {
    borderRadius: 24,
    padding: 24,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },

  closeButton: {
    padding: 4,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 24,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  optionInfo: {
    flex: 1,
  },

  optionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 14,
  },
});