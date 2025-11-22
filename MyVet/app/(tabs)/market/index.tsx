// app/(tabs)/market/index.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions, Animated } from 'react-native';
import StoreScreen from './store';
import MapScreen from './map';

const { width } = Dimensions.get('window');
const TAB_WIDTH = (width - 66) / 2; // 66 = padding horizontal total (25*2 + gap)

export default function MarketIndex() {
  const [activeTab, setActiveTab] = useState<'store' | 'map'>('store');
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(slideAnim, {
      toValue: activeTab === 'store' ? 0 : TAB_WIDTH + 8,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();
  }, [activeTab]);

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Marketplace</Text>

          {/* TABS */}
          <View style={styles.tabsContainer}>
            <Animated.View
              style={[
                styles.tabIndicator,
                {
                  transform: [{ translateX: slideAnim }],
                  width: TAB_WIDTH,
                },
              ]}
            />
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('store')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'store' && styles.tabTextActive,
                ]}
              >
                Tienda
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.tab}
              onPress={() => setActiveTab('map')}
            >
              <Text
                style={[
                  styles.tabText,
                  activeTab === 'map' && styles.tabTextActive,
                ]}
              >
                Mapa
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* CONTENT */}
      {activeTab === 'store' ? <StoreScreen /> : <MapScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },

  /* HEADER */
  header: {
    backgroundColor: '#7B2CBF',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    paddingTop: 60,
    paddingBottom: 20,
  },

  headerContent: {
    paddingHorizontal: 25,
  },

  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 20,
    marginTop:10,
  },

  /* TABS */
  tabsContainer: {
    position: 'relative',
    flexDirection: 'row',
    gap: 8,
    borderRadius: 20,
    padding: 4,
  },

  tabIndicator: {
    position: 'absolute',
    height: '100%',
    backgroundColor: '#fff',
    borderRadius: 16,
    top: 4,
    left: 4,
  },

  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    zIndex: 1,
  },

  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.7)',
  },

  tabTextActive: {
    color: '#7B2CBF',
  },
});