import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
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

export function NetworkErrorOverlay() {
  const { isOffline, retry } = useNetwork();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: isOffline ? 1 : 0,
      duration: 250,
      useNativeDriver: true,
    }).start();
  }, [isOffline, opacity]);

  if (!isOffline) return null;

  return (
    <Animated.View
      style={[styles.overlay, { opacity }]}
      pointerEvents={isOffline ? "auto" : "none"}
    >
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            paddingBottom: insets.bottom + 24,
            paddingTop: insets.top + 24,
          },
        ]}
      >
        <View style={styles.iconWrap}>
          <Feather name="wifi-off" size={52} color={colors.mutedForeground} />
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>
          No Connection
        </Text>

        <Text style={[styles.body, { color: colors.mutedForeground }]}>
          Check your internet connection and tap retry to continue.
        </Text>

        <Pressable
          onPress={retry}
          style={({ pressed }) => [
            styles.retryBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Retry connection"
        >
          <Feather name="refresh-cw" size={16} color="#FFFFFF" style={styles.retryIcon} />
          <Text style={styles.retryText}>Tap to Retry</Text>
        </Pressable>

        <Text style={[styles.hint, { color: colors.mutedForeground }]}>
          We&apos;ll reconnect automatically when internet is back.
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 9999,
  },
  card: {
    width: "85%",
    maxWidth: 380,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    paddingHorizontal: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  iconWrap: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryIcon: {
    marginRight: 8,
  },
  retryText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 18,
  },
});
