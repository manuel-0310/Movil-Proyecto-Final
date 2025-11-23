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
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

interface QRModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function QRModal({ visible, onClose }: QRModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={styles.modalContainer}>
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            style={styles.modalContent}
          >
            <View style={styles.header}>
              <Text style={styles.title}>Smart QR</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={28} color="#111827" />
              </TouchableOpacity>
            </View>

            <Text style={styles.description}>
              Gestiona los códigos QR de tus mascotas para que puedan ser
              identificadas fácilmente si se pierden.
            </Text>

            {/* OPCIÓN 1: CREAR QR */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                router.push('../qr/create');
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="qr-code" size={32} color="#7B2CBF" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Crear QR</Text>
                <Text style={styles.optionDescription}>
                  Genera un código QR para tu mascota
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
            </TouchableOpacity>

            {/* OPCIÓN 2: ESCANEAR QR */}
            <TouchableOpacity
              style={styles.optionCard}
              onPress={() => {
                onClose();
                router.push('../qr/scan');
              }}
            >
              <View style={styles.iconContainer}>
                <Ionicons name="scan" size={32} color="#7B2CBF" />
              </View>
              <View style={styles.optionInfo}>
                <Text style={styles.optionTitle}>Escanear QR</Text>
                <Text style={styles.optionDescription}>
                  Lee la información de un código QR
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#9CA3AF" />
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  modalContainer: {
    width: width - 48,
    maxWidth: 400,
  },

  modalContent: {
    backgroundColor: '#fff',
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
    color: '#111827',
  },

  closeButton: {
    padding: 4,
  },

  description: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 24,
  },

  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
  },

  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3E8FF',
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
    color: '#111827',
    marginBottom: 4,
  },

  optionDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
});