import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import ViewShot from 'react-native-view-shot';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthContext';

type IoniconsName = React.ComponentProps<typeof Ionicons>['name'];

interface Pet {
  id: string;
  name: string;
  type: string;
  breed: string;
  sex: string;
  birthday: string;
  weight: number;
  photo_url?: string;
  qr_code_url?: string;
}

export default function CreateQRScreen() {
  const { user } = useAuth();
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPet, setSelectedPet] = useState<Pet | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [qrGenerated, setQrGenerated] = useState(false);

  // Ref para capturar el QR como imagen (NO base64, NO FileSystem paths)
  const qrViewRef = useRef<ViewShot | null>(null);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pets')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPets(data || []);
    } catch (error) {
      console.error('Error loading pets:', error);
      Alert.alert('Error', 'No se pudieron cargar las mascotas');
    } finally {
      setLoading(false);
    }
  };

  const generateQR = () => {
    if (!selectedPet) {
      Alert.alert(
        'Selecciona una mascota',
        'Debes seleccionar una mascota primero'
      );
      return;
    }
    setQrGenerated(true);
  };

  const downloadQR = async () => {
    if (!selectedPet || !qrViewRef.current) return;

    try {
      setGenerating(true);

      // 1) Capturar el QR como imagen local (URI tipo file://...)
      const uri = await qrViewRef.current.capture?.();
      if (!uri) {
        throw new Error('No se pudo capturar la imagen del código QR');
      }

      // 2) Leer el archivo y convertirlo a bytes (SIN base64)
      const response = await fetch(uri);
      const arrayBuffer = await response.arrayBuffer();
const bytes = new Uint8Array(arrayBuffer);


      const fileName = `qr-${selectedPet.id}-${Date.now()}.png`;
      const storagePath = `${user?.id}/${fileName}`;

      // 3) Subir al bucket "qr-codes" en Supabase
      const { error: uploadError } = await supabase.storage
        .from('qr-codes')
        .upload(storagePath, bytes, {
          contentType: 'image/png',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // 4) Obtener URL pública y guardarla en la mascota
      const { data: urlData } = supabase.storage
        .from('qr-codes')
        .getPublicUrl(storagePath);
      const publicUrl = urlData.publicUrl;

      const { error: updateError } = await supabase
        .from('pets')
        .update({ qr_code_url: publicUrl })
        .eq('id', selectedPet.id);

      if (updateError) throw updateError;

      // 5) Permiso para acceder a la galería
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permiso requerido',
          'Activa el permiso de acceso a fotos para guardar el QR en tu galería.'
        );
        return;
      }

      // 6) Guardar la imagen capturada en la galería (usando el URI de ViewShot)
      await MediaLibrary.saveToLibraryAsync(uri);

      // 7) Compartir (opcional)
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, {
          mimeType: 'image/png',
          dialogTitle: 'Compartir código QR',
          UTI: 'public.png',
        });
      }

      Alert.alert(
        'QR generado',
        'El código QR se guardó en tu galería y se puede compartir.',
        [{ text: 'OK', onPress: () => router.back() }]
      );
    } catch (error: any) {
      console.error('Error saving QR:', error);
      Alert.alert(
        'Error',
        `No se pudo guardar el código QR: ${error.message}`
      );
    } finally {
      setGenerating(false);
    }
  };

  const getPetIcon = (type: string): IoniconsName => {
    const icons: { [key: string]: IoniconsName } = {
      dog: 'paw',
      cat: 'heart',
      bird: 'airplane',
      rabbit: 'happy',
      hamster: 'radio-button-on',
      fish: 'water',
      turtle: 'shield',
      other: 'ellipsis-horizontal',
    };
    return icons[type] || 'paw';
  };

  const qrData = selectedPet ? `myvet://pet/${selectedPet.id}` : '';

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View className="header" style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Smart QR</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!qrGenerated ? (
          <>
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                MyVet crea una etiqueta QR personalizada para tu mascota
              </Text>
              <Text style={styles.infoDescription}>
                Cuando alguien lo escanee, podrá ver instantáneamente el perfil
                público de tu mascota y contactarte si se pierde.
              </Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>¿Qué pueden ver otros?</Text>
              <View style={styles.featuresList}>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>Nombre de la mascota</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>Foto</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>Edad</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>Raza</Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>
                    Información de contacto del dueño
                  </Text>
                </View>
                <View style={styles.featureItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.featureText}>Y más</Text>
                </View>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Selecciona una mascota</Text>
              {loading ? (
                <ActivityIndicator size="large" color="#7B2CBF" />
              ) : (
                pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={[
                      styles.petCard,
                      selectedPet?.id === pet.id && styles.petCardSelected,
                    ]}
                    onPress={() => setSelectedPet(pet)}
                  >
                    {pet.photo_url ? (
                      <Image source={{ uri: pet.photo_url }} style={styles.petImage} />
                    ) : (
                      <View style={styles.petImagePlaceholder}>
                        <Ionicons
                          name={getPetIcon(pet.type)}
                          size={32}
                          color="#7B2CBF"
                        />
                      </View>
                    )}
                    <View style={styles.petInfo}>
                      <Text style={styles.petName}>{pet.name}</Text>
                      <Text style={styles.petBreed}>
                        {pet.breed || 'Sin raza'}
                      </Text>
                    </View>
                    {selectedPet?.id === pet.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#7B2CBF" />
                    )}
                  </TouchableOpacity>
                ))
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.generateButton,
                !selectedPet && styles.generateButtonDisabled,
              ]}
              onPress={generateQR}
              disabled={!selectedPet}
            >
              <Text style={styles.generateButtonText}>Crear Código QR</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.qrContainer}>
              <View style={styles.qrCard}>
                <View style={styles.qrHeader}>
                  <Ionicons name="paw" size={32} color="#7B2CBF" />
                </View>

                {/* ViewShot envuelve al QR para poder capturarlo como imagen */}
                <ViewShot
                  ref={qrViewRef}
                  options={{ format: 'png', quality: 1 }}
                  style={styles.qrCodeWrapper}
                >
                  <QRCode value={qrData} size={200} />
                </ViewShot>

                <Text style={styles.petNameQR}>{selectedPet?.name}</Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.downloadButton,
                generating && styles.downloadButtonDisabled,
              ]}
              onPress={downloadQR}
              disabled={generating}
            >
              {generating ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Ionicons name="download" size={20} color="#fff" />
                  <Text style={styles.downloadButtonText}>Descargar QR</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push('/qr/scan')}
            >
              <Text style={styles.scanButtonText}>Escanear QR</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },

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

  backButton: { padding: 8 },

  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#fff' },

  content: { flex: 1, padding: 24 },

  infoCard: {
    backgroundColor: '#F9FAFB',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
  },

  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 12,
    lineHeight: 22,
  },

  infoDescription: { fontSize: 14, color: '#6B7280', lineHeight: 20 },

  section: { marginBottom: 24 },

  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 16,
  },

  featuresList: { gap: 12 },

  featureItem: { flexDirection: 'row', alignItems: 'center', gap: 12 },

  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#7B2CBF',
  },

  featureText: { fontSize: 15, color: '#374151' },

  petCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },

  petCardSelected: {
    borderColor: '#7B2CBF',
    backgroundColor: '#F3E8FF',
  },

  petImage: { width: 56, height: 56, borderRadius: 28, marginRight: 16 },

  petImagePlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  petInfo: { flex: 1 },

  petName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  petBreed: { fontSize: 14, color: '#6B7280' },

  generateButton: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    marginTop: 8,
  },

  generateButtonDisabled: { opacity: 0.5 },

  generateButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  qrContainer: { alignItems: 'center', marginVertical: 32 },

  qrCard: {
    backgroundColor: '#fff',
    padding: 32,
    borderRadius: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },

  qrHeader: { marginBottom: 24 },

  qrCodeWrapper: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 16,
    marginBottom: 24,
  },

  petNameQR: { fontSize: 20, fontWeight: 'bold', color: '#111827' },

  downloadButton: {
    backgroundColor: '#7B2CBF',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 12,
  },

  downloadButtonDisabled: { opacity: 0.5 },

  downloadButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },

  scanButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 16,
    borderRadius: 24,
    alignItems: 'center',
  },

  scanButtonText: { color: '#7B2CBF', fontSize: 16, fontWeight: '600' },
});
