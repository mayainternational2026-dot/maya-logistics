import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [trackingInput, setTrackingInput] = useState("");
  const [trackingError, setTrackingError] = useState<string | null>(null);

  const handleTrack = () => {
    const trimmed = trackingInput.trim();
    if (!trimmed) {
      setTrackingError("Please enter a tracking ID.");
      return;
    }
    setTrackingError(null);
    router.push(`/track/${encodeURIComponent(trimmed)}` as any);
  };

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await login(email.trim().toLowerCase(), password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Login failed";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  const styles = makeStyles(colors, insets);

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <View style={styles.logoCircle}>
              <Feather name="package" size={36} color="#FFFFFF" />
            </View>
          </View>
          <Text style={styles.brand}>Maya Logistics</Text>
          <Text style={styles.subtitle}>Track your shipments anywhere</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign in</Text>

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="mail" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="you@example.com"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                testID="login-email"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
                testID="login-password"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.loginBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-submit"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.loginBtnText}>Sign in</Text>
            )}
          </Pressable>
        </View>

        <View style={styles.dividerRow}>
          <View style={[styles.dividerLine, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
          <Text style={styles.dividerText}>or</Text>
          <View style={[styles.dividerLine, { backgroundColor: "rgba(255,255,255,0.15)" }]} />
        </View>

        <View style={styles.trackCard}>
          <View style={styles.trackCardHeader}>
            <Feather name="map-pin" size={16} color={colors.crimson} />
            <Text style={styles.trackCardTitle}>Track a package</Text>
          </View>
          <Text style={styles.trackCardSubtitle}>
            No account needed — enter a tracking ID to check status instantly.
          </Text>

          {trackingError && (
            <View style={styles.trackErrorBox}>
              <Feather name="alert-circle" size={13} color={colors.destructive} />
              <Text style={styles.trackErrorText}>{trackingError}</Text>
            </View>
          )}

          <View style={styles.trackInputRow}>
            <View style={[styles.trackInputWrap, { borderColor: colors.border }]}>
              <Feather name="search" size={15} color={colors.mutedForeground} style={styles.trackInputIcon} />
              <TextInput
                style={[styles.trackInput, { color: colors.foreground }]}
                placeholder="e.g. MYA-20240001"
                placeholderTextColor={colors.mutedForeground}
                autoCapitalize="characters"
                autoCorrect={false}
                value={trackingInput}
                onChangeText={(t) => {
                  setTrackingInput(t);
                  if (trackingError) setTrackingError(null);
                }}
                onSubmitEditing={handleTrack}
                returnKeyType="search"
                testID="track-input"
              />
            </View>
            <Pressable
              onPress={handleTrack}
              style={({ pressed }) => [styles.trackBtn, { opacity: pressed ? 0.8 : 1 }]}
              testID="track-submit"
            >
              <Feather name="arrow-right" size={18} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

        <Text style={styles.footer}>
          Maya Import Export Logistic · Kathmandu, Nepal
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>) {
  const isWeb = Platform.OS === "web";
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.navy,
    },
    scroll: {
      flexGrow: 1,
      paddingTop: isWeb ? insets.top + 67 : insets.top + 40,
      paddingBottom: isWeb ? 34 : insets.bottom + 24,
      paddingHorizontal: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 36,
    },
    logoContainer: {
      marginBottom: 16,
    },
    logoCircle: {
      width: 80,
      height: 80,
      borderRadius: 40,
      backgroundColor: colors.crimson,
      alignItems: "center",
      justifyContent: "center",
    },
    brand: {
      fontSize: 28,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.6)",
      marginTop: 6,
    },
    card: {
      backgroundColor: colors.background,
      borderRadius: 20,
      padding: 24,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 24,
      elevation: 8,
    },
    cardTitle: {
      fontSize: 22,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
      marginBottom: 20,
    },
    errorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: `${colors.destructive}15`,
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    errorText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.destructive,
    },
    fieldGroup: {
      marginBottom: 16,
    },
    label: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      color: colors.mutedForeground,
      marginBottom: 6,
    },
    inputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      height: 48,
    },
    inputIcon: {
      marginRight: 8,
    },
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      height: "100%",
    },
    eyeButton: {
      padding: 4,
    },
    loginBtn: {
      marginTop: 8,
      backgroundColor: colors.crimson,
      borderRadius: 12,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    loginBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    footer: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.4)",
      marginTop: 32,
    },
    dividerRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      marginTop: 20,
      marginBottom: 16,
    },
    dividerLine: {
      flex: 1,
      height: 1,
    },
    dividerText: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.4)",
    },
    trackCard: {
      backgroundColor: "rgba(255,255,255,0.06)",
      borderRadius: 16,
      padding: 18,
      borderWidth: 1,
      borderColor: "rgba(255,255,255,0.1)",
    },
    trackCardHeader: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      marginBottom: 6,
    },
    trackCardTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    trackCardSubtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.55)",
      marginBottom: 14,
      lineHeight: 18,
    },
    trackErrorBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      backgroundColor: `rgba(220,38,38,0.12)`,
      borderRadius: 8,
      padding: 10,
      marginBottom: 10,
    },
    trackErrorText: {
      flex: 1,
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.destructive,
    },
    trackInputRow: {
      flexDirection: "row",
      gap: 10,
      alignItems: "center",
    },
    trackInputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: colors.background,
      paddingHorizontal: 12,
      height: 46,
    },
    trackInputIcon: {
      marginRight: 8,
    },
    trackInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      height: "100%",
    },
    trackBtn: {
      width: 46,
      height: 46,
      borderRadius: 10,
      backgroundColor: colors.crimson,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
