import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuth();
  const isWeb = Platform.OS === "web";
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") {
      confirmLogout();
    } else {
      Alert.alert("Sign out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        { text: "Sign out", style: "destructive", onPress: confirmLogout },
      ]);
    }
  };

  const confirmLogout = async () => {
    setSigningOut(true);
    try {
      await logout();
    } finally {
      setSigningOut(false);
    }
  };

  const styles = makeStyles(colors, insets, isWeb);

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "?";

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Profile</Text>
      </View>

      <View style={styles.avatarSection}>
        <View style={styles.avatarCircle}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.userName}>{user?.name ?? "—"}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{user?.role ?? "customer"}</Text>
        </View>
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <InfoRow icon="mail" label="Email" value={user?.email ?? "—"} colors={colors} />
        <InfoRow icon="phone" label="Phone" value={user?.phone ?? "—"} colors={colors} />
        <InfoRow icon="shield" label="Account type" value={user?.role ?? "—"} colors={colors} isLast />
      </View>

      <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>About</Text>
        <View style={styles.aboutRow}>
          <Feather name="map-pin" size={14} color={colors.mutedForeground} />
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            Maya Import Export Logistic
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Feather name="globe" size={14} color={colors.mutedForeground} />
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            Anandamaya Marg, Dhumbarahi, Kathmandu
          </Text>
        </View>
        <View style={styles.aboutRow}>
          <Feather name="phone" size={14} color={colors.mutedForeground} />
          <Text style={[styles.aboutText, { color: colors.foreground }]}>
            +977 9768595133
          </Text>
        </View>
      </View>

      <Pressable
        onPress={handleLogout}
        disabled={signingOut}
        style={({ pressed }) => [
          styles.logoutBtn,
          { opacity: pressed || signingOut ? 0.7 : 1 },
        ]}
        testID="logout-button"
      >
        <Feather name="log-out" size={16} color={colors.destructive} />
        <Text style={[styles.logoutText, { color: colors.destructive }]}>
          {signingOut ? "Signing out…" : "Sign out"}
        </Text>
      </Pressable>

      <Text style={[styles.version, { color: colors.mutedForeground }]}>
        Maya Logistics Mobile · v1.0.0
      </Text>
    </ScrollView>
  );
}

function InfoRow({
  icon,
  label,
  value,
  colors,
  isLast,
}: {
  icon: string;
  label: string;
  value: string;
  colors: ReturnType<typeof useColors>;
  isLast?: boolean;
}) {
  return (
    <View
      style={[
        rowStyles.row,
        !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border },
      ]}
    >
      <View style={rowStyles.iconBox}>
        <Feather name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={rowStyles.textBox}>
        <Text style={[rowStyles.label, { color: colors.mutedForeground }]}>{label}</Text>
        <Text style={[rowStyles.value, { color: colors.foreground }]}>{value}</Text>
      </View>
    </View>
  );
}

const rowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 12,
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(219,20,60,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  textBox: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
  },
});

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>, isWeb: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    scroll: {
      paddingBottom: isWeb ? 34 : insets.bottom + 80,
    },
    topBar: {
      backgroundColor: colors.background,
      paddingTop: isWeb ? insets.top + 67 : insets.top,
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    screenTitle: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    avatarSection: {
      alignItems: "center",
      paddingVertical: 32,
      gap: 8,
    },
    avatarCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    avatarText: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
    },
    userName: {
      fontSize: 20,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    roleBadge: {
      backgroundColor: `${colors.primary}15`,
      paddingHorizontal: 12,
      paddingVertical: 4,
      borderRadius: 20,
    },
    roleText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
      color: colors.primary,
      textTransform: "capitalize",
    },
    card: {
      marginHorizontal: 16,
      marginBottom: 12,
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 12,
    },
    aboutRow: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: 10,
      marginBottom: 10,
    },
    aboutText: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
    },
    logoutBtn: {
      marginHorizontal: 16,
      marginTop: 8,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingVertical: 14,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: `${colors.destructive}30`,
      backgroundColor: `${colors.destructive}08`,
    },
    logoutText: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
    },
    version: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 24,
    },
  });
}
