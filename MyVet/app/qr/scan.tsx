// app/qr/scan.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { router } from 'expo-router';
import { Camera, CameraView } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

export default function ScanQRScreen() {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    requestCameraPermission();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    if (scanned) return;
    setScanned(true);

    // Verificar si es un QR de MyVet
    if (data.startsWith('myvet://pet/')) {
      const petId = data.replace('myvet://pet/', '');
      router.push(`/qr/pet-info/${petId}`);
    } else {
      Alert.alert(
        'QR no válido',
        'Este código QR no pertenece a MyVet',
        [
          {
            text: 'Escanear otro',
            onPress: () => setScanned(false),
          },
          {
            text: 'Cerrar',
            onPress: () => router.back(),
          },
        ]
      );
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.message}>Solicitando permiso de cámara...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <View style={styles.permissionContainer}>
          <Ionicons name="camera-outline" size={64} color="#9CA3AF" />
          <Text style={styles.permissionTitle}>Permiso de cámara requerido</Text>
          <Text style={styles.permissionText}>
            Necesitamos acceso a tu cámara para escanear códigos QR
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => Linking.openSettings()}
          >
            <Text style={styles.settingsButtonText}>Abrir configuración</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        {/* HEADER */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.headerButton}
          >
            <Ionicons name="close" size={32} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* SCANNER OVERLAY */}
        <View style={styles.scannerOverlay}>
          <View style={styles.scannerFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>

        {/* INSTRUCTIONS */}
        <View style={styles.instructions}>
          <Text style={styles.instructionsText}>
            Coloca el código QR dentro del marco
          </Text>
        </View>

        {/* RESCAN BUTTON */}
        {scanned && (
          <TouchableOpacity
            style={styles.rescanButton}
            onPress={() => setScanned(false)}
          >
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.rescanButtonText}>Escanear otro</Text>
          </TouchableOpacity>
        )}
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },

  camera: {
    flex: 1,
  },

  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },

  headerButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  scannerOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  scannerFrame: {
    width: 280,
    height: 280,
    position: 'relative',
  },

  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#7B2CBF',
  },

  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },

  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },

  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },

  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },

  instructions: {
    padding: 20,
    paddingBottom: 40,
  },

  instructionsText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '600',
  },

  rescanButton: {
    position: 'absolute',
    bottom: 40,
    alignSelf: 'center',
    backgroundColor: '#7B2CBF',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 24,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },

  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  message: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
  },

  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#fff',
  },

  permissionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },

  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 32,
  },

  settingsButton: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 24,
    marginBottom: 12,
  },

  settingsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },

  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },

  backButtonText: {
    color: '#7B2CBF',
    fontSize: 16,
    fontWeight: '600',
  },
});