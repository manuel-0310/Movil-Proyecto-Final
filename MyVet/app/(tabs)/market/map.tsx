// app/(tabs)/market/map.tsx
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { supabase } from '@/utils/supabase';

interface Store {
  id: string;
  name: string;
  address: string;
  distance?: string;
  latitude: number;
  longitude: number;
  phone?: string;
  rating?: number;
  reviews_count?: number;
  is_open_24h: boolean;
  type: string;
}

export default function MapScreen() {
  const [stores, setStores] = useState<Store[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const filters = ['Open 24h', 'Nearest', 'Veterinary', 'Pet Store'];

  useEffect(() => {
    loadStores();
  }, [activeFilters]);

  const loadStores = async () => {
    try {
      setLoading(true);
      let query = supabase
        .from('stores')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      // Aplicar filtros
      if (activeFilters.includes('Open 24h')) {
        query = query.eq('is_open_24h', true);
      }
      if (activeFilters.includes('Veterinary')) {
        query = query.eq('type', 'veterinary');
      }
      if (activeFilters.includes('Pet Store')) {
        query = query.eq('type', 'pet_store');
      }

      const { data, error } = await query;

      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error loading stores:', error);
      Alert.alert('Error', 'No se pudieron cargar las tiendas');
    } finally {
      setLoading(false);
    }
  };

  const toggleFilter = (filter: string) => {
    setActiveFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    );
  };

  const handleCall = (phone?: string) => {
    if (phone) {
      Linking.openURL(`tel:${phone}`);
    } else {
      Alert.alert('Sin teléfono', 'Esta tienda no tiene teléfono registrado');
    }
  };

  const handleNavigation = (latitude: number, longitude: number) => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${latitude},${longitude}`;
    Linking.openURL(url);
  };

  const filteredStores = stores.filter(
    (store) =>
      store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      store.address.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#7B2CBF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.contentContainer}
    >
      {/* MAP */}
      <View style={styles.mapContainer}>
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: 4.6560,
            longitude: -74.0595,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {filteredStores.map((store) => (
            <Marker
              key={store.id}
              coordinate={{
                latitude: store.latitude,
                longitude: store.longitude,
              }}
              pinColor="#7B2CBF"
              title={store.name}
              description={store.address}
            />
          ))}
        </MapView>
      </View>

      {/* SEARCH BAR */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by name or zone"
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons
          name="search"
          size={20}
          color="#9CA3AF"
          style={styles.searchIcon}
        />
      </View>

      {/* FILTERS */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      >
        {filters.map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterChip,
              activeFilters.includes(filter) && styles.filterChipActive,
            ]}
            onPress={() => toggleFilter(filter)}
          >
            <Text
              style={[
                styles.filterText,
                activeFilters.includes(filter) && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* STORES LIST */}
      <View style={styles.storesContainer}>
        {filteredStores.map((store) => (
          <View key={store.id} style={styles.storeCard}>
            <View style={styles.storeInfo}>
              <Text style={styles.storeName}>{store.name}</Text>
              <Text style={styles.storeAddress}>
                {store.address}
                {store.distance && ` - ${store.distance}`}
              </Text>
              {store.rating && (
                <View style={styles.ratingContainer}>
                  <Ionicons name="star" size={16} color="#FCD34D" />
                  <Text style={styles.ratingText}>{store.rating}</Text>
                  <Text style={styles.reviewsText}>
                    ({store.reviews_count || 0})
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.storeActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleCall(store.phone)}
              >
                <Ionicons name="call" size={20} color="#7B2CBF" />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => handleNavigation(store.latitude, store.longitude)}
              >
                <Ionicons name="navigate" size={20} color="#7B2CBF" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {filteredStores.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="location-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No se encontraron tiendas</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  contentContainer: {
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  /* MAP */
  mapContainer: {
    height: 260,
    marginHorizontal: 25,
    marginTop: 20,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },

  map: {
    width: '100%',
    height: '100%',
  },

  /* SEARCH */
  searchContainer: {
    marginHorizontal: 25,
    marginTop: 16,
    position: 'relative',
  },

  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 20,
    paddingRight: 50,
    fontSize: 15,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    color: '#111827',
  },

  searchIcon: {
    position: 'absolute',
    right: 20,
    top: '50%',
    transform: [{ translateY: -10 }],
  },

  /* FILTERS */
  filtersContainer: {
    paddingHorizontal: 25,
    paddingVertical: 16,
    gap: 10,
  },

  filterChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    marginRight: 10,
  },

  filterChipActive: {
    backgroundColor: '#7B2CBF',
  },

  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },

  filterTextActive: {
    color: '#fff',
  },

  /* STORES */
  storesContainer: {
    paddingHorizontal: 25,
    paddingTop: 8,
    gap: 12,
  },

  storeCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    marginBottom: 12,
  },

  storeInfo: {
    flex: 1,
  },

  storeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 4,
  },

  storeAddress: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },

  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },

  ratingText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111827',
  },

  reviewsText: {
    fontSize: 14,
    color: '#9CA3AF',
  },

  storeActions: {
    flexDirection: 'row',
    gap: 8,
    marginLeft: 12,
  },

  actionButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* EMPTY STATE */
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },

  emptyText: {
    fontSize: 16,
    color: '#9CA3AF',
    marginTop: 16,
  },
});