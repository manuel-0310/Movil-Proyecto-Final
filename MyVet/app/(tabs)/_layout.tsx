import React, { useEffect, useMemo, useState } from "react";
import { View, TouchableOpacity, StyleSheet, LayoutChangeEvent } from "react-native";
import { Tabs, usePathname, useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";

export default function BubbleTabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <BubbleTabBar {...props} />}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="store" />
      <Tabs.Screen name="profile" />
    </Tabs>
  );
}

function BubbleTabBar(props: any) {
  const pathname = usePathname();
  const router = useRouter();
  const [barWidth, setBarWidth] = useState(0);

  // Detectar si estamos dentro de un chat individual
  const isChatDetail =
  pathname.startsWith("/chats/") && pathname !== "/chats" ||
  pathname.startsWith("/add-pet/") || pathname.startsWith("/pet-detail/");



  const routes = [
    { name: "home", path: "/home" },
    { name: "chats", path: "/chats" },
    { name: "store", path: "/market" },
    { name: "profile", path: "/profile" },
  ];

  const currentIndex = useMemo(() => {
    if (pathname.startsWith("/tabs/chats")) return 1;
    const index = routes.findIndex((route) => pathname === route.path);
    return index >= 0 ? index : 0;
  }, [pathname]);

  const TAB_WIDTH = useMemo(
    () => (barWidth ? barWidth / routes.length : 0),
    [barWidth]
  );

  const offsetX = useSharedValue(0);

  useEffect(() => {
    if (!TAB_WIDTH) return;
    offsetX.value = withTiming(currentIndex * TAB_WIDTH, { duration: 250 });
  }, [currentIndex, TAB_WIDTH]);

  const bubbleStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offsetX.value }],
  }));

  const onLayoutBar = (e: LayoutChangeEvent) =>
    setBarWidth(e.nativeEvent.layout.width);

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      {/* Solo mostrar la barra si NO estamos dentro de un chat */}
      {!isChatDetail && (
        <View style={styles.tabBar} onLayout={onLayoutBar}>
          {TAB_WIDTH > 0 && (
            <Animated.View
              style={[styles.bubble, { width: barWidth * 0.2 }, bubbleStyle]}
            />
          )}

          {routes.map((route, index) => {
            const isFocused = currentIndex === index;
            const onPress = () => router.push(route.path as any);

            let outline: any = "home-outline";
            let filled: any = "home";
            if (route.name === "chats") {
              outline = "chatbubbles-outline";
              filled = "chatbubbles";
            }
            if (route.name === "store") {
              outline = "storefront-outline";
              filled = "storefront";
            }
            if (route.name === "profile") {
              outline = "person-outline";
              filled = "person";
            }

            return (
              <TouchableOpacity
                key={route.name}
                onPress={onPress}
                style={[styles.tabButton, { width: TAB_WIDTH }]}
                activeOpacity={0.9}
              >
                <Ionicons
                  name={isFocused ? filled : outline}
                  size={26}
                  color="#fff"
                />
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  tabBar: {
    alignSelf: "center",
    position: "absolute",
    bottom: 20,
    height: 70,
    borderRadius: 40,
    paddingHorizontal: 2,
    backgroundColor: "#7B2FF7",
    flexDirection: "row",
    alignItems: "center",
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    width: "90%",
  },
  bubble: {
    position: "absolute",
    left: 10,
    top: 10,
    bottom: 10,
    borderRadius: 999,
    backgroundColor: "#9D4EDD",
    zIndex: 1,
  },
  tabButton: {
    zIndex: 2,
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
