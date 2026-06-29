import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActionSheetIOS,
  Alert,
  Image,
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
import { api } from "@/lib/api";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const MAX_IMAGES = 4;

type AttachedImage = { name: string; dataUrl: string; uri: string };

type FormErrors = {
  name?: string;
  email?: string;
  productDetails?: string;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InquiryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: user?.phone ?? "",
    productDetails: "",
    productLink: "",
    quantity: "",
    estimatedCost: "",
  });
  const [images, setImages] = useState<AttachedImage[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set = (field: keyof typeof form) => (text: string) => {
    setForm((prev) => ({ ...prev, [field]: text }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const pickFromSource = async (useCamera: boolean) => {
    const remaining = MAX_IMAGES - images.length;
    if (remaining <= 0) return;

    if (useCamera) {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Allow camera access to take product photos.");
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.7, base64: true });
      if (result.canceled || !result.assets[0]?.base64) return;
      const asset = result.assets[0];
      const mime = asset.mimeType ?? "image/jpeg";
      const ext = mime.split("/")[1] ?? "jpg";
      const name = asset.fileName ?? `photo_${Date.now()}.${ext}`;
      const dataUrl = `data:${mime};base64,${asset.base64}`;
      setImages((prev) => [...prev, { name, dataUrl, uri: asset.uri }].slice(0, MAX_IMAGES));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "Allow access to your photo library to attach product photos.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsMultipleSelection: true,
        selectionLimit: remaining,
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;
      const newImages: AttachedImage[] = result.assets
        .filter((a) => a.base64)
        .map((a) => {
          const mime = a.mimeType ?? "image/jpeg";
          const ext = mime.split("/")[1] ?? "jpg";
          const name = a.fileName ?? `photo_${Date.now()}.${ext}`;
          return { name, dataUrl: `data:${mime};base64,${a.base64}`, uri: a.uri };
        });
      setImages((prev) => [...prev, ...newImages].slice(0, MAX_IMAGES));
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddPhoto = () => {
    if (images.length >= MAX_IMAGES) {
      Alert.alert("Limit reached", `You can attach up to ${MAX_IMAGES} photos.`);
      return;
    }
    if (Platform.OS === "ios") {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ["Cancel", "Take Photo", "Choose from Library"], cancelButtonIndex: 0 },
        (idx) => {
          if (idx === 1) pickFromSource(true);
          else if (idx === 2) pickFromSource(false);
        },
      );
    } else {
      Alert.alert("Add Photo", "Choose a source", [
        { text: "Camera", onPress: () => pickFromSource(true) },
        { text: "Photo Library", onPress: () => pickFromSource(false) },
        { text: "Cancel", style: "cancel" },
      ]);
    }
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Full name is required";
    if (!form.email.trim()) {
      errs.email = "Email is required";
    } else if (!EMAIL_RE.test(form.email.trim())) {
      errs.email = "Enter a valid email address";
    }
    if (!form.productDetails.trim()) errs.productDetails = "Please describe your product";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    try {
      await api.createInquiry({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || undefined,
        productDetails: form.productDetails.trim(),
        productLink: form.productLink.trim() || undefined,
        quantity: form.quantity ? Number(form.quantity) : undefined,
        estimatedCost: form.estimatedCost ? Number(form.estimatedCost) : undefined,
        images: images.length > 0 ? images.map(({ name, dataUrl }) => ({ name, dataUrl })) : undefined,
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setSubmitted(true);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (Platform.OS === "web") {
        alert(err.message ?? "Submission failed. Please try again.");
      } else {
        Alert.alert("Submission failed", err.message ?? "Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setSubmitted(false);
    setForm({
      name: user?.name ?? "",
      email: user?.email ?? "",
      phone: user?.phone ?? "",
      productDetails: "",
      productLink: "",
      quantity: "",
      estimatedCost: "",
    });
    setImages([]);
    setErrors({});
  };

  const styles = makeStyles(colors, insets, isWeb);

  if (submitted) {
    return (
      <View style={styles.root}>
        <View style={styles.topBar}>
          <Text style={styles.screenTitle}>Inquiry</Text>
        </View>
        <View style={styles.successContainer}>
          <View style={[styles.successIcon, { backgroundColor: "#10B98118" }]}>
            <Feather name="check-circle" size={48} color="#10B981" />
          </View>
          <Text style={[styles.successTitle, { color: colors.foreground }]}>
            Inquiry Submitted!
          </Text>
          <Text style={[styles.successBody, { color: colors.mutedForeground }]}>
            Thank you! We've received your inquiry and will respond within 24 hours with a custom freight quote.
          </Text>
          <Pressable
            onPress={handleReset}
            style={({ pressed }) => [
              styles.submitBtn,
              { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Text style={styles.submitBtnText}>Submit Another</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Inquiry</Text>
        <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
          Request a custom freight quote
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Your Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Full Name <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: errors.name ? colors.destructive : colors.border,
                },
              ]}
              placeholder="Ram Bahadur"
              placeholderTextColor={colors.mutedForeground}
              value={form.name}
              onChangeText={set("name")}
              autoCapitalize="words"
              returnKeyType="next"
            />
            {errors.name && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Email <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: errors.email ? colors.destructive : colors.border,
                },
              ]}
              placeholder="ram@email.com"
              placeholderTextColor={colors.mutedForeground}
              value={form.email}
              onChangeText={set("email")}
              keyboardType="email-address"
              autoCapitalize="none"
              returnKeyType="next"
            />
            {errors.email && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.email}</Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone</Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              placeholder="+977 98XXXXXXXX"
              placeholderTextColor={colors.mutedForeground}
              value={form.phone}
              onChangeText={set("phone")}
              keyboardType="phone-pad"
              returnKeyType="next"
            />
          </View>
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Product Details</Text>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Product Description <Text style={{ color: colors.destructive }}>*</Text>
            </Text>
            <TextInput
              style={[
                styles.textarea,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: errors.productDetails ? colors.destructive : colors.border,
                },
              ]}
              placeholder="Describe the product — type, brand, material, size, special handling requirements…"
              placeholderTextColor={colors.mutedForeground}
              value={form.productDetails}
              onChangeText={set("productDetails")}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
            {errors.productDetails && (
              <Text style={[styles.errorText, { color: colors.destructive }]}>
                {errors.productDetails}
              </Text>
            )}
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Product Link{" "}
              <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>(optional)</Text>
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  color: colors.foreground,
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
              placeholder="https://amazon.com/product…"
              placeholderTextColor={colors.mutedForeground}
              value={form.productLink}
              onChangeText={set("productLink")}
              keyboardType="url"
              autoCapitalize="none"
              returnKeyType="next"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.fieldGroup, styles.halfField]}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Quantity</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. 10"
                placeholderTextColor={colors.mutedForeground}
                value={form.quantity}
                onChangeText={set("quantity")}
                keyboardType="numeric"
                returnKeyType="next"
              />
            </View>

            <View style={[styles.fieldGroup, styles.halfField]}>
              <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Est. Value (NPR)</Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    color: colors.foreground,
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="e.g. 25000"
                placeholderTextColor={colors.mutedForeground}
                value={form.estimatedCost}
                onChangeText={set("estimatedCost")}
                keyboardType="numeric"
                returnKeyType="done"
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
              Product Photos{" "}
              <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>
                (optional, up to {MAX_IMAGES})
              </Text>
            </Text>

            {images.length > 0 && (
              <View style={styles.thumbnailRow}>
                {images.map((img, i) => (
                  <View key={i} style={styles.thumbnailWrapper}>
                    <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                    <Pressable
                      onPress={() => handleRemoveImage(i)}
                      style={[styles.removeBtn, { backgroundColor: colors.destructive }]}
                      hitSlop={4}
                    >
                      <Feather name="x" size={10} color="#fff" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}

            {images.length < MAX_IMAGES && (
              <Pressable
                onPress={handleAddPhoto}
                style={({ pressed }) => [
                  styles.addPhotoBtn,
                  {
                    borderColor: colors.border,
                    backgroundColor: pressed ? colors.surface : colors.background,
                  },
                ]}
              >
                <Feather name="camera" size={18} color={colors.mutedForeground} />
                <Text style={[styles.addPhotoBtnText, { color: colors.mutedForeground }]}>
                  {images.length === 0 ? "Add Photos" : "Add More"}
                </Text>
              </Pressable>
            )}
          </View>
        </View>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            handleSubmit();
          }}
          disabled={loading}
          style={({ pressed }) => [
            styles.submitBtn,
            {
              backgroundColor: colors.primary,
              opacity: pressed || loading ? 0.75 : 1,
            },
          ]}
          testID="submit-inquiry-btn"
        >
          {loading ? (
            <Text style={styles.submitBtnText}>Submitting…</Text>
          ) : (
            <Text style={styles.submitBtnText}>Submit Inquiry</Text>
          )}
        </Pressable>

        <Text style={[styles.footnote, { color: colors.mutedForeground }]}>
          We respond within 24 hours. You can also reach us on WhatsApp: +977 9769686908
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function makeStyles(
  colors: ReturnType<typeof useColors>,
  insets: ReturnType<typeof useSafeAreaInsets>,
  isWeb: boolean
) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
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
      marginBottom: 2,
    },
    screenSubtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: isWeb ? 34 : insets.bottom + 100,
      gap: 12,
    },
    card: {
      padding: 16,
      borderRadius: 14,
      borderWidth: 1,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
      gap: 0,
    },
    sectionLabel: {
      fontSize: 11,
      fontFamily: "Inter_600SemiBold",
      textTransform: "uppercase",
      letterSpacing: 0.8,
      marginBottom: 14,
    },
    fieldGroup: {
      marginBottom: 14,
    },
    fieldLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      marginBottom: 6,
    },
    optionalText: {
      fontFamily: "Inter_400Regular",
      fontSize: 12,
    },
    input: {
      height: 44,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    textarea: {
      minHeight: 100,
      borderWidth: 1,
      borderRadius: 10,
      paddingHorizontal: 12,
      paddingTop: 10,
      fontSize: 15,
      fontFamily: "Inter_400Regular",
    },
    row: {
      flexDirection: "row",
      gap: 12,
    },
    halfField: {
      flex: 1,
      marginBottom: 0,
    },
    errorText: {
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      marginTop: 4,
    },
    thumbnailRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 8,
      marginBottom: 10,
    },
    thumbnailWrapper: {
      position: "relative",
    },
    thumbnail: {
      width: 72,
      height: 72,
      borderRadius: 8,
    },
    removeBtn: {
      position: "absolute",
      top: -6,
      right: -6,
      width: 20,
      height: 20,
      borderRadius: 10,
      alignItems: "center",
      justifyContent: "center",
    },
    addPhotoBtn: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 44,
      borderWidth: 1,
      borderStyle: "dashed",
      borderRadius: 10,
    },
    addPhotoBtnText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    submitBtn: {
      height: 50,
      borderRadius: 12,
      alignItems: "center",
      justifyContent: "center",
      marginTop: 4,
    },
    submitBtnText: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      color: "#FFFFFF",
    },
    footnote: {
      textAlign: "center",
      fontSize: 12,
      fontFamily: "Inter_400Regular",
      lineHeight: 18,
      paddingHorizontal: 8,
    },
    successContainer: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 16,
    },
    successIcon: {
      width: 96,
      height: 96,
      borderRadius: 48,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 8,
    },
    successTitle: {
      fontSize: 22,
      fontFamily: "Inter_700Bold",
      textAlign: "center",
    },
    successBody: {
      fontSize: 15,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 22,
    },
  });
}
