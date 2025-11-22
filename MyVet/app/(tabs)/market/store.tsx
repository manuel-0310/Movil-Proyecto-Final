// app/(tabs)/market/store.tsx
import React, { useState, useEffect } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/utils/supabase';

interface Product {
  id: string;
  category: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  created_at: string;
}

export default function StoreScreen() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error loading products:', error);
      Alert.alert('Error', 'No se pudieron cargar los productos');
    } finally {
      setLoading(false);
    }
  };

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
      {products.map((product) => (
        <TouchableOpacity key={product.id} style={styles.productCard}>
          <Image
            source={{
              uri: product.image_url || 'https://via.placeholder.com/120',
            }}
            style={styles.productImage}
          />
          <View style={styles.productInfo}>
            <Text style={styles.productCategory}>{product.category}</Text>
            <Text style={styles.productName}>{product.name}</Text>
            {product.description && (
              <Text style={styles.productDescription} numberOfLines={1}>
                {product.description}
              </Text>
            )}
            <View style={styles.priceTag}>
              <Text style={styles.priceText}>
                ${product.price.toFixed(2)} UDS
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}

      {products.length === 0 && (
        <View style={styles.emptyState}>
          <Ionicons name="cart-outline" size={64} color="#D1D5DB" />
          <Text style={styles.emptyText}>No hay productos disponibles</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  contentContainer: {
    padding: 25,
    paddingBottom: 100,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },

  /* PRODUCTS */
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 24,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
    overflow: 'hidden',
  },

  productImage: {
    width: 112,
    height: 112,
    borderRadius: 20,
    margin: 12,
  },

  productInfo: {
    flex: 1,
    padding: 12,
    paddingLeft: 0,
    justifyContent: 'space-between',
  },

  productCategory: {
    fontSize: 12,
    color: '#7B2CBF',
    fontWeight: '600',
    marginBottom: 4,
  },

  productName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 2,
  },

  productDescription: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 8,
  },

  priceTag: {
    alignSelf: 'flex-start',
    backgroundColor: '#7B2CBF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
  },

  priceText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
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