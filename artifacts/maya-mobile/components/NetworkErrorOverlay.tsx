import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useNetwork } from "@/context/NetworkContext";

const BANNER_HEIGHT = 44;

export function NetworkErrorOverlay() {
  const { isOffline, retry } = useNetwork();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top))).current;
  const [mounted, setMounted] = useState(isOffline);

  useEffect(() => {
    if (isOffline) {
      setMounted(true);
    }
    Animated.timing(translateY, {
      toValue: isOffline ? 0 : -(BANNER_HEIGHT + insets.top),
      duration: 250,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished && !isOffline) {
        setMounted(false);
      }
    });
  }, [isOffline, insets.top, translateY]);

  if (!mounted) return null;

  return (
    <Animated.View
      style={[
        styles.banner,
        {
          backgroundColor: colors.crimson,
          paddingTop: insets.top,
          height: BANNER_HEIGHT + insets.top,
          transform: [{ translateY }],
        },
      ]}
      pointerEvents={isOffline ? "box-none" : "none"}
    >
      <View style={styles.content}>
        <Feather name="wifi-off" size={14} color="#FFFFFF" style={styles.icon} />
        <Text style={styles.text} numberOfLines={1}>
          No connection — retrying…
        </Text>
        <Pressable
          onPress={retry}
          hitSlop={8}
          style={({ pressed }) => [styles.retryBtn, { opacity: pressed ? 0.6 : 1 }]}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    justifyContent: "flex-end",
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    height: BANNER_HEIGHT,
  },
  icon: {
    marginRight: 8,
  },
  text: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  retryBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    textDecorationLine: "underline",
  },
});
