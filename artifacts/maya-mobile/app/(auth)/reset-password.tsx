import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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
import { useColors } from "@/hooks/useColors";
import { api } from "@/lib/api";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { email, demoOtp } = useLocalSearchParams<{ email: string; demoOtp?: string }>();

  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendMessage, setResendMessage] = useState<string | null>(null);

  const passwordRef = useRef<TextInput>(null);
  const confirmRef = useRef<TextInput>(null);

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  const handleResend = async () => {
    if (resending || resendCooldown > 0) return;
    setError(null);
    setResendMessage(null);
    setResending(true);
    try {
      const data = await api.forgotPassword((email ?? "").trim().toLowerCase());
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setResendMessage("A new code has been sent to your email.");
      setResendCooldown(30);
      if (data.otp) {
        router.setParams({ demoOtp: data.otp } as any);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Could not resend code";
      setError(msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setResending(false);
    }
  };

  const handleSubmit = async () => {
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length !== 6) {
      setError("Please enter the 6-digit code from your email.");
      return;
    }
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await api.resetPassword({
        email: email ?? "",
        otp: trimmedOtp,
        newPassword,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace({
        pathname: "/(auth)/login",
        params: { resetSuccess: "1" },
      } as any);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Reset failed";
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
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Feather name="arrow-left" size={22} color="#FFFFFF" />
          </Pressable>
          <View style={styles.logoCircle}>
            <Feather name="shield" size={32} color="#FFFFFF" />
          </View>
          <Text style={styles.brand}>Reset password</Text>
          <Text style={styles.subtitle}>
            We sent a 6-digit code to
          </Text>
          <Text style={styles.emailHighlight}>{email}</Text>
        </View>

        <View style={styles.card}>
          {demoOtp && (
            <View style={styles.demoBox}>
              <Feather name="info" size={14} color={colors.navy} />
              <Text style={styles.demoText}>
                Demo OTP: <Text style={styles.demoOtpText}>{demoOtp}</Text>
              </Text>
            </View>
          )}

          {error && (
            <View style={styles.errorBox}>
              <Feather name="alert-circle" size={14} color={colors.destructive} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          {resendMessage && (
            <View style={styles.successBox}>
              <Feather name="check-circle" size={14} color="#15803D" />
              <Text style={styles.successText}>{resendMessage}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Verification code</Text>
            <View style={[styles.otpInputRow, { borderColor: colors.border }]}>
              <Feather name="shield" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                style={[styles.otpInput, { color: colors.foreground }]}
                placeholder="000000"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="number-pad"
                maxLength={6}
                returnKeyType="next"
                value={otp}
                onChangeText={(v) => {
                  setOtp(v.replace(/\D/g, ""));
                  if (error) setError(null);
                }}
                onSubmitEditing={() => passwordRef.current?.focus()}
                testID="reset-otp"
              />
            </View>
            <Text style={styles.hint}>Code expires in 15 minutes.</Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>New password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                ref={passwordRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                value={newPassword}
                onChangeText={(v) => {
                  setNewPassword(v);
                  if (error) setError(null);
                }}
                onSubmitEditing={() => confirmRef.current?.focus()}
                testID="reset-new-password"
              />
              <Pressable onPress={() => setShowPassword((v) => !v)} style={styles.eyeButton}>
                <Feather
                  name={showPassword ? "eye-off" : "eye"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
            <Text style={styles.hint}>
              At least 8 characters, one uppercase letter, one number.
            </Text>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Confirm new password</Text>
            <View style={[styles.inputRow, { borderColor: colors.border }]}>
              <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
              <TextInput
                ref={confirmRef}
                style={[styles.input, { color: colors.foreground }]}
                placeholder="••••••••"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showConfirm}
                returnKeyType="done"
                value={confirmPassword}
                onChangeText={(v) => {
                  setConfirmPassword(v);
                  if (error) setError(null);
                }}
                onSubmitEditing={handleSubmit}
                testID="reset-confirm-password"
              />
              <Pressable onPress={() => setShowConfirm((v) => !v)} style={styles.eyeButton}>
                <Feather
                  name={showConfirm ? "eye-off" : "eye"}
                  size={16}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>
          </View>

          <Pressable
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed || loading ? 0.85 : 1 }]}
            onPress={handleSubmit}
            disabled={loading}
            testID="reset-submit"
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.submitBtnText}>Set new password</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleResend}
            disabled={resending || resendCooldown > 0}
            style={styles.resendLink}
            testID="reset-resend"
          >
            {resending ? (
              <ActivityIndicator color={colors.crimson} size="small" />
            ) : (
              <Text style={styles.resendLinkText}>
                Didn't receive the code?{" "}
                <Text
                  style={[
                    styles.resendLinkBold,
                    resendCooldown > 0 && { color: colors.mutedForeground },
                  ]}
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
                </Text>
              </Text>
            )}
          </Pressable>
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
      paddingTop: isWeb ? insets.top + 67 : insets.top + 32,
      paddingBottom: isWeb ? 34 : insets.bottom + 24,
      paddingHorizontal: 24,
    },
    header: {
      alignItems: "center",
      marginBottom: 32,
    },
    backBtn: {
      alignSelf: "flex-start",
      marginBottom: 20,
    },
    logoCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.crimson,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 14,
    },
    brand: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: "#FFFFFF",
      letterSpacing: -0.5,
    },
    subtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.6)",
      marginTop: 6,
    },
    emailHighlight: {
      fontSize: 14,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
      marginTop: 2,
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
    demoBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#FEF9C3",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    demoText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: colors.navy,
    },
    demoOtpText: {
      fontFamily: "Inter_700Bold",
      letterSpacing: 2,
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
    successBox: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      backgroundColor: "#DCFCE7",
      borderRadius: 8,
      padding: 12,
      marginBottom: 16,
    },
    successText: {
      flex: 1,
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      color: "#15803D",
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
    otpInputRow: {
      flexDirection: "row",
      alignItems: "center",
      borderWidth: 1,
      borderRadius: 10,
      backgroundColor: colors.surface,
      paddingHorizontal: 12,
      height: 56,
    },
    inputIcon: {
      marginRight: 8,
    },
    otpInput: {
      flex: 1,
      fontSize: 24,
      fontFamily: "Inter_600SemiBold",
      letterSpacing: 6,
      height: "100%",
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
    input: {
      flex: 1,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      height: "100%",
    },
    eyeButton: {
      padding: 4,
    },
    hint: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
      marginTop: 6,
      lineHeight: 17,
    },
    submitBtn: {
      marginTop: 8,
      backgroundColor: colors.crimson,
      borderRadius: 12,
      height: 50,
      alignItems: "center",
      justifyContent: "center",
    },
    submitBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    resendLink: {
      marginTop: 16,
      alignItems: "center",
    },
    resendLinkText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      color: colors.mutedForeground,
    },
    resendLinkBold: {
      fontFamily: "Inter_600SemiBold",
      color: colors.crimson,
    },
    footer: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      color: "rgba(255,255,255,0.4)",
      marginTop: 32,
    },
  });
}
