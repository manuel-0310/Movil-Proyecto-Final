// app/onboarding/index.tsx
import { useState, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  FlatList,
  Animated,
  Image,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useOnboarding } from "@/contexts/OnboardingContext";
import { SvgUri } from "react-native-svg";

const { width } = Dimensions.get("window");

const slides = [
  {
    id: "1",
    title: "Tu veterinario\nvirtual 24/7",
    subtitle: "Recibe ayuda inmediata para emergencias y dudas sobre tus mascotas.",
    illustration: require("@/assets/images/doodles/DogJumpDoodle.svg"),
  },
  {
    id: "2",
    title: "Control total de\nla salud",
    subtitle: "Vacunas, citas, historial, peso y recordatorios en un solo lugar.",
    illustration: require("@/assets/images/doodles/DoogieDoodle.svg"),
  },
  {
    id: "3",
    title: "Encuentra tiendas\ny clínicas cerca",
    subtitle: "Explora el mapa de tu ciudad y descubre servicios para tu mascota.",
    illustration: require("@/assets/images/doodles/PettingDoodle.svg"),
  },
];

export default function Onboarding() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const { completeOnboarding } = useOnboarding();
  const flatListRef = useRef<FlatList>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems[0]) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const handleNext = () => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    } else {
      handleFinish();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleFinish = async () => {
    await completeOnboarding();
    router.replace("/(auth)/login");
  };

  const renderItem = ({ item }: any) => (
    <View style={styles.slide}>
      {/* Ilustración SVG */}
      <Image 
        source={item.illustration} 
        style={styles.illustration}
        resizeMode="contain"
      />
      
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.subtitle}>{item.subtitle}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* HEADER */}
      <View style={styles.header}>
        <Ionicons name="paw" size={44} color="#fff" />
      </View>

      {/* SLIDES */}
      <FlatList
        ref={flatListRef}
        data={slides}
        renderItem={renderItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: false }
        )}
        scrollEventThrottle={32}
        onViewableItemsChanged={viewableItemsChanged}
        viewabilityConfig={viewConfig}
      />

      {/* DOTS */}
      <View style={styles.dots}>
        {slides.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, currentIndex === i && styles.dotActive]}
          />
        ))}
      </View>

      {/* NAVIGATION */}
      <View style={styles.navigation}>
        {/* Botón Atrás */}
        {currentIndex > 0 ? (
          <TouchableOpacity 
            onPress={handlePrevious}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-back" size={28} color="#7B2CBF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={handleSkip}>
            <Text style={styles.skip}>Omitir</Text>
          </TouchableOpacity>
        )}

        {/* Botón Siguiente / Comenzar */}
        {currentIndex < slides.length - 1 ? (
          <TouchableOpacity 
            onPress={handleNext}
            style={styles.arrowButton}
          >
            <Ionicons name="chevron-forward" size={28} color="#7B2CBF" />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.finishBtn} onPress={handleFinish}>
            <Text style={styles.finishText}>Comenzar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },

  header: {
    height: 150,
    backgroundColor: "#7B2CBF",
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  slide: {
    width,
    paddingHorizontal: 40,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 40,
  },

  illustration: {
    width: 280,
    height: 280,
    marginBottom: 30,
  },

  title: {
    fontSize: 32,
    fontWeight: "800",
    textAlign: "center",
    color: "#000",
    marginBottom: 20,
  },

  subtitle: {
    fontSize: 17,
    color: "#555",
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 10,
  },

  dots: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 30,
    gap: 10,
  },

  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#ccc",
  },

  dotActive: {
    backgroundColor: "#7B2CBF",
    width: 30,
  },

  navigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 30,
    paddingBottom: 40,
  },

  arrowButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#F0E6F6",
    justifyContent: "center",
    alignItems: "center",
  },

  skip: {
    color: "#7B2CBF",
    fontSize: 18,
    fontWeight: "600",
  },

  finishBtn: {
    backgroundColor: "#7B2CBF",
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 25,
  },

  finishText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },
});