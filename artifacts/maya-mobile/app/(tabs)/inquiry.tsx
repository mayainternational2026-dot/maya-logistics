import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActionSheetIOS,
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, type Inquiry, type InquiryFollowup } from "@/lib/api";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

const MAX_IMAGES = 4;
// Per-image size guard (applied after quality: 0.6 compression).
// expo-image-picker v17 does not expose maxWidth/maxHeight, so quality is the
// only lever for reducing payload size. We still verify the resulting base64
// string — if a photo is still over 1 MB of actual image data after JPEG
// compression at 0.6, we reject it with a clear error rather than hanging.
//
// base64 encoding inflates byte size by ~33 %, so a 1 MB image becomes
// ~1.37 M characters of base64 text. We compare dataUrl string length as a
// fast proxy for actual byte size.
const MAX_IMAGE_BYTES = 1 * 1024 * 1024; // 1 MB
const MAX_IMAGE_DATA_URL_LEN = Math.ceil(MAX_IMAGE_BYTES * (4 / 3)); // ~1.37 M chars
// Total base64 budget across all images (well under the 10 MB API body limit).
const MAX_TOTAL_DATA_URL_LEN = 4 * MAX_IMAGE_DATA_URL_LEN; // ~5.5 M chars

const MAX_RESIZE_PX = 800;

/**
 * Resize an image so its longest side is at most MAX_RESIZE_PX, then compress
 * it to JPEG at quality 0.6. Returns a base64 dataUrl and the compressed URI.
 *
 * expo-image-picker v17 does not expose maxWidth/maxHeight, so we do the resize
 * step ourselves via expo-image-manipulator after picking.
 */
async function resizeAndEncode(
  uri: string,
  srcWidth: number,
  srcHeight: number,
): Promise<{ dataUrl: string; compressedUri: string }> {
  const needsResize = srcWidth > MAX_RESIZE_PX || srcHeight > MAX_RESIZE_PX;
  const resizeAction = needsResize
    ? srcWidth >= srcHeight
      ? [{ resize: { width: MAX_RESIZE_PX } }]
      : [{ resize: { height: MAX_RESIZE_PX } }]
    : [];

  const result = await manipulateAsync(uri, resizeAction, {
    compress: 0.6,
    format: SaveFormat.JPEG,
    base64: true,
  });

  if (!result.base64) {
    throw new Error("Image processing failed — no base64 output.");
  }
  return {
    dataUrl: `data:image/jpeg;base64,${result.base64}`,
    compressedUri: result.uri,
  };
}

type Tab = "new" | "history";
type AttachedImage = { name: string; dataUrl: string; uri: string };
type FormErrors = { name?: string; email?: string; productDetails?: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  pending:   { label: "Pending",   color: "#92400E", bg: "#FEF3C7" },
  reviewing: { label: "Reviewing", color: "#1D4ED8", bg: "#DBEAFE" },
  quoted:    { label: "Quoted",    color: "#065F46", bg: "#D1FAE5" },
  closed:    { label: "Closed",    color: "#6B7280", bg: "#F3F4F6" },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? { label: status, color: "#6B7280", bg: "#F3F4F6" };
  return (
    <View style={{ backgroundColor: cfg.bg, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start" }}>
      <Text style={{ fontSize: 11, fontFamily: "Inter_600SemiBold", color: cfg.color }}>{cfg.label}</Text>
    </View>
  );
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
}

export default function InquiryScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<Tab>("new");

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

  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);

  const fetchHistory = useCallback(async () => {
    if (!user) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await api.listMyInquiries();
      setInquiries(data);
    } catch (e: any) {
      setHistoryError(e.message ?? "Failed to load inquiries");
    } finally {
      setHistoryLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === "history" && user) {
      fetchHistory();
    }
  }, [activeTab, user, fetchHistory]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchHistory();
    setRefreshing(false);
  };

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
      const result = await ImagePicker.launchCameraAsync({ quality: 1 });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const name = asset.fileName ?? `photo_${Date.now()}.jpg`;
      let encoded: { dataUrl: string; compressedUri: string };
      try {
        encoded = await resizeAndEncode(asset.uri, asset.width, asset.height);
      } catch {
        Alert.alert("Processing failed", "Could not process the photo. Please try again.");
        return;
      }
      if (encoded.dataUrl.length > MAX_IMAGE_DATA_URL_LEN) {
        Alert.alert(
          "Photo too large",
          "This photo is too large to attach even after resizing and compression. Please choose a smaller image.",
        );
        return;
      }
      setImages((prev) => [...prev, { name, dataUrl: encoded.dataUrl, uri: encoded.compressedUri }].slice(0, MAX_IMAGES));
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
        quality: 1,
      });
      if (result.canceled) return;
      const oversized: string[] = [];
      const settled = await Promise.allSettled(
        result.assets.map(async (a) => {
          const ext = (a.mimeType ?? "image/jpeg").split("/")[1] ?? "jpg";
          const name = a.fileName ?? `photo_${Date.now()}.${ext}`;
          const encoded = await resizeAndEncode(a.uri, a.width, a.height);
          if (encoded.dataUrl.length > MAX_IMAGE_DATA_URL_LEN) {
            oversized.push(name);
            return null;
          }
          return { name, dataUrl: encoded.dataUrl, uri: encoded.compressedUri } as AttachedImage;
        }),
      );
      const newImages: AttachedImage[] = settled
        .filter((r): r is PromiseFulfilledResult<AttachedImage> => r.status === "fulfilled" && r.value !== null)
        .map((r) => r.value);
      if (oversized.length > 0) {
        Alert.alert(
          "Photo too large",
          `${oversized.length === 1 ? "1 photo was" : `${oversized.length} photos were`} too large to attach even after resizing and compression and ${oversized.length === 1 ? "was" : "were"} skipped. Please choose smaller images.`,
        );
      }
      if (newImages.length === 0) return;
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

    const totalLen = images.reduce((sum, img) => sum + img.dataUrl.length, 0);
    if (totalLen > MAX_TOTAL_DATA_URL_LEN) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (Platform.OS === "web") {
        alert("The attached photos are too large in total. Please remove one or more photos and try again.");
      } else {
        Alert.alert(
          "Photos too large",
          "The attached photos are too large in total. Please remove one or more photos and try again.",
        );
      }
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
      if (user) {
        fetchHistory();
      }
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
          {user && (
            <Pressable
              onPress={() => { handleReset(); setActiveTab("history"); }}
              style={({ pressed }) => [
                styles.submitBtn,
                { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, opacity: pressed ? 0.8 : 1, marginBottom: 8 },
              ]}
            >
              <Text style={[styles.submitBtnText, { color: colors.foreground }]}>View My Inquiries</Text>
            </Pressable>
          )}
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
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>Inquiry</Text>
        {user ? (
          <View style={[styles.tabRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Pressable
              onPress={() => setActiveTab("new")}
              style={[
                styles.tabBtn,
                activeTab === "new" && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[
                styles.tabBtnText,
                { color: activeTab === "new" ? "#fff" : colors.mutedForeground },
              ]}>New</Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab("history")}
              style={[
                styles.tabBtn,
                activeTab === "history" && { backgroundColor: colors.primary },
              ]}
            >
              <Text style={[
                styles.tabBtnText,
                { color: activeTab === "history" ? "#fff" : colors.mutedForeground },
              ]}>My Inquiries</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={[styles.screenSubtitle, { color: colors.mutedForeground }]}>
            Request a custom freight quote
          </Text>
        )}
      </View>

      {activeTab === "history" ? (
        <HistoryView
          inquiries={inquiries}
          loading={historyLoading}
          error={historyError}
          refreshing={refreshing}
          onRefresh={onRefresh}
          onSelect={setSelectedInquiry}
          colors={colors}
          insets={insets}
          isWeb={isWeb}
        />
      ) : (
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {!user && (
              <Text style={[styles.screenSubtitle, { color: colors.mutedForeground, marginBottom: 4 }]}>
                Request a custom freight quote
              </Text>
            )}

            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionLabel, { color: colors.mutedForeground }]}>Your Details</Text>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Full Name <Text style={{ color: colors.destructive }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: errors.name ? colors.destructive : colors.border }]}
                  placeholder="Ram Bahadur"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.name}
                  onChangeText={set("name")}
                  autoCapitalize="words"
                  returnKeyType="next"
                />
                {errors.name && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.name}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Email <Text style={{ color: colors.destructive }}>*</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: errors.email ? colors.destructive : colors.border }]}
                  placeholder="ram@email.com"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.email}
                  onChangeText={set("email")}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  returnKeyType="next"
                />
                {errors.email && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.email}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>Phone</Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
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
                  style={[styles.textarea, { color: colors.foreground, backgroundColor: colors.surface, borderColor: errors.productDetails ? colors.destructive : colors.border }]}
                  placeholder="Describe the product — type, brand, material, size, special handling requirements…"
                  placeholderTextColor={colors.mutedForeground}
                  value={form.productDetails}
                  onChangeText={set("productDetails")}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
                {errors.productDetails && <Text style={[styles.errorText, { color: colors.destructive }]}>{errors.productDetails}</Text>}
              </View>

              <View style={styles.fieldGroup}>
                <Text style={[styles.fieldLabel, { color: colors.foreground }]}>
                  Product Link{" "}
                  <Text style={[styles.optionalText, { color: colors.mutedForeground }]}>(optional)</Text>
                </Text>
                <TextInput
                  style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
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
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
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
                    style={[styles.input, { color: colors.foreground, backgroundColor: colors.surface, borderColor: colors.border }]}
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
                      { borderColor: colors.border, backgroundColor: pressed ? colors.surface : colors.background },
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
                { backgroundColor: colors.primary, opacity: pressed || loading ? 0.75 : 1 },
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
      )}

      {selectedInquiry && (
        <InquiryDetailModal
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          colors={colors}
          insets={insets}
        />
      )}
    </View>
  );
}

function HistoryView({
  inquiries,
  loading,
  error,
  refreshing,
  onRefresh,
  onSelect,
  colors,
  insets,
  isWeb,
}: {
  inquiries: Inquiry[];
  loading: boolean;
  error: string | null;
  refreshing: boolean;
  onRefresh: () => Promise<void>;
  onSelect: (i: Inquiry) => void;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
  isWeb: boolean;
}) {
  if (loading && inquiries.length === 0) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }}>
        <Feather name="alert-circle" size={40} color={colors.destructive} />
        <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.foreground, textAlign: "center" }}>{error}</Text>
        <Pressable onPress={onRefresh} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
          <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: colors.primary }}>Try again</Text>
        </Pressable>
      </View>
    );
  }

  if (inquiries.length === 0) {
    return (
      <ScrollView
        contentContainerStyle={{ flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 12 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
      >
        <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: "center", justifyContent: "center" }}>
          <Feather name="inbox" size={32} color={colors.mutedForeground} />
        </View>
        <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 17, color: colors.foreground }}>No inquiries yet</Text>
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.mutedForeground, textAlign: "center", lineHeight: 20 }}>
          Inquiries you submit will appear here so you can track their status.
        </Text>
      </ScrollView>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, paddingBottom: isWeb ? 34 : insets.bottom + 100, gap: 10 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      {inquiries.map((inq) => (
        <InquiryCard key={inq.id} inquiry={inq} onPress={() => onSelect(inq)} colors={colors} />
      ))}
    </ScrollView>
  );
}

function InquiryCard({
  inquiry,
  onPress,
  colors,
}: {
  inquiry: Inquiry;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}) {
  const snippet = inquiry.productDetails.length > 90
    ? inquiry.productDetails.slice(0, 90) + "…"
    : inquiry.productDetails;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? colors.surface : colors.card,
        borderWidth: 1,
        borderColor: colors.border,
        borderRadius: 14,
        padding: 14,
        gap: 8,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
        elevation: 1,
      })}
    >
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <Text
          style={{ flex: 1, fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground, lineHeight: 20 }}
          numberOfLines={2}
        >
          {snippet}
        </Text>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} style={{ marginTop: 2 }} />
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
        <StatusBadge status={inquiry.status} />
        <Text style={{ fontFamily: "Inter_400Regular", fontSize: 12, color: colors.mutedForeground }}>
          {formatDate(inquiry.createdAt)}
        </Text>
      </View>
    </Pressable>
  );
}

function InquiryDetailModal({
  inquiry,
  onClose,
  colors,
  insets,
}: {
  inquiry: Inquiry;
  onClose: () => void;
  colors: ReturnType<typeof useColors>;
  insets: ReturnType<typeof useSafeAreaInsets>;
}) {
  const images = inquiry.images
    ? (() => { try { return JSON.parse(inquiry.images) as Array<{ name: string; dataUrl: string }>; } catch { return []; } })()
    : [];

  const [followups, setFollowups] = useState<InquiryFollowup[]>([]);
  const [followupsLoading, setFollowupsLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [composeText, setComposeText] = useState("");
  const [sending, setSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setFollowupsLoading(true);
      try {
        const data = await api.listInquiryFollowups(inquiry.id);
        if (!cancelled) setFollowups(data);
      } catch {
        // silently ignore — follow-up thread is non-critical
      } finally {
        if (!cancelled) setFollowupsLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [inquiry.id]);

  const handleSendFollowup = async () => {
    const msg = composeText.trim();
    if (!msg) return;
    setSending(true);
    try {
      const newFollowup = await api.createInquiryFollowup(inquiry.id, msg);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setFollowups((prev) => [newFollowup, ...prev]);
      setComposeText("");
      setShowCompose(false);
      setSentSuccess(true);
      setTimeout(() => setSentSuccess(false), 3000);
    } catch (err: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      if (Platform.OS === "web") {
        alert(err.message ?? "Failed to send. Please try again.");
      } else {
        Alert.alert("Send failed", err.message ?? "Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingTop: insets.top + 12,
          paddingBottom: 12,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.background,
        }}>
          <Text style={{ fontFamily: "Inter_700Bold", fontSize: 18, color: colors.foreground }}>
            Inquiry Details
          </Text>
          <Pressable onPress={onClose} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
          <ScrollView
            contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 32 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <StatusBadge status={inquiry.status} />
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground }}>
                {formatDate(inquiry.createdAt)}
              </Text>
            </View>

            <DetailSection label="Product Description" colors={colors}>
              <Text style={{ fontFamily: "Inter_400Regular", fontSize: 15, color: colors.foreground, lineHeight: 22 }}>
                {inquiry.productDetails}
              </Text>
            </DetailSection>

            {inquiry.productLink ? (
              <DetailSection label="Product Link" colors={colors}>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.primary, lineHeight: 20 }} numberOfLines={2}>
                  {inquiry.productLink}
                </Text>
              </DetailSection>
            ) : null}

            {(inquiry.quantity != null || inquiry.estimatedCost != null) && (
              <View style={{ flexDirection: "row", gap: 12 }}>
                {inquiry.quantity != null && (
                  <DetailSection label="Quantity" colors={colors} style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.foreground }}>{inquiry.quantity}</Text>
                  </DetailSection>
                )}
                {inquiry.estimatedCost != null && (
                  <DetailSection label="Est. Value" colors={colors} style={{ flex: 1 }}>
                    <Text style={{ fontFamily: "Inter_500Medium", fontSize: 15, color: colors.foreground }}>NPR {inquiry.estimatedCost.toLocaleString()}</Text>
                  </DetailSection>
                )}
              </View>
            )}

            {images.length > 0 && (
              <DetailSection label="Attached Photos" colors={colors}>
                <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                  {images.map((img, i) => (
                    <Image
                      key={i}
                      source={{ uri: img.dataUrl }}
                      style={{ width: 80, height: 80, borderRadius: 8, borderWidth: 1, borderColor: colors.border }}
                    />
                  ))}
                </View>
              </DetailSection>
            )}

            {inquiry.adminNotes ? (
              <DetailSection label="Admin Notes" colors={colors}>
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
                  {inquiry.adminNotes}
                </Text>
              </DetailSection>
            ) : null}

            {/* ── Follow-up thread ── */}
            <View style={{ gap: 10 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: colors.foreground }}>
                  Follow-ups
                </Text>
                {!showCompose && (
                  <Pressable
                    onPress={() => { setShowCompose(true); setSentSuccess(false); }}
                    style={({ pressed }) => ({
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 5,
                      backgroundColor: colors.primary,
                      paddingHorizontal: 12,
                      paddingVertical: 6,
                      borderRadius: 8,
                      opacity: pressed ? 0.8 : 1,
                    })}
                    testID="followup-btn"
                  >
                    <Feather name="message-circle" size={14} color="#fff" />
                    <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 13, color: "#fff" }}>Follow up</Text>
                  </Pressable>
                )}
              </View>

              {sentSuccess && (
                <View style={{ flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#D1FAE5", borderRadius: 10, padding: 12 }}>
                  <Feather name="check-circle" size={16} color="#065F46" />
                  <Text style={{ fontFamily: "Inter_500Medium", fontSize: 13, color: "#065F46", flex: 1 }}>
                    Message sent — we'll get back to you soon.
                  </Text>
                </View>
              )}

              {showCompose && (
                <View style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 12, gap: 10 }}>
                  <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 12, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.6 }}>
                    Your message
                  </Text>
                  <TextInput
                    style={{
                      minHeight: 90,
                      borderWidth: 1,
                      borderColor: colors.border,
                      borderRadius: 10,
                      padding: 10,
                      fontSize: 15,
                      fontFamily: "Inter_400Regular",
                      color: colors.foreground,
                      backgroundColor: colors.surface,
                      textAlignVertical: "top",
                    }}
                    placeholder="Add any extra details or questions about your inquiry…"
                    placeholderTextColor={colors.mutedForeground}
                    value={composeText}
                    onChangeText={setComposeText}
                    multiline
                    maxLength={2000}
                    autoFocus
                  />
                  <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground, textAlign: "right" }}>
                    {composeText.length}/2000
                  </Text>
                  <View style={{ flexDirection: "row", gap: 8 }}>
                    <Pressable
                      onPress={() => { setShowCompose(false); setComposeText(""); }}
                      style={({ pressed }) => ({
                        flex: 1,
                        height: 42,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.surface,
                        borderWidth: 1,
                        borderColor: colors.border,
                        opacity: pressed ? 0.7 : 1,
                      })}
                    >
                      <Text style={{ fontFamily: "Inter_500Medium", fontSize: 14, color: colors.foreground }}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        handleSendFollowup();
                      }}
                      disabled={sending || !composeText.trim()}
                      style={({ pressed }) => ({
                        flex: 2,
                        height: 42,
                        borderRadius: 10,
                        alignItems: "center",
                        justifyContent: "center",
                        backgroundColor: colors.primary,
                        opacity: pressed || sending || !composeText.trim() ? 0.6 : 1,
                      })}
                      testID="send-followup-btn"
                    >
                      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 14, color: "#fff" }}>
                        {sending ? "Sending…" : "Send Message"}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}

              {followupsLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ alignSelf: "center", marginTop: 8 }} />
              ) : followups.length === 0 ? (
                <Text style={{ fontFamily: "Inter_400Regular", fontSize: 13, color: colors.mutedForeground, textAlign: "center", paddingVertical: 8 }}>
                  No follow-ups yet. Tap "Follow up" to add context or ask a question.
                </Text>
              ) : (
                <View style={{ gap: 8 }}>
                  {followups.map((fu) => (
                    <View key={fu.id} style={{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, gap: 6 }}>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 14, color: colors.foreground, lineHeight: 20 }}>
                        {fu.message}
                      </Text>
                      <Text style={{ fontFamily: "Inter_400Regular", fontSize: 11, color: colors.mutedForeground }}>
                        {formatDate(fu.createdAt)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

function DetailSection({
  label,
  children,
  colors,
  style,
}: {
  label: string;
  children: React.ReactNode;
  colors: ReturnType<typeof useColors>;
  style?: object;
}) {
  return (
    <View style={[{ backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, gap: 6 }, style]}>
      <Text style={{ fontFamily: "Inter_600SemiBold", fontSize: 11, color: colors.mutedForeground, textTransform: "uppercase", letterSpacing: 0.6 }}>
        {label}
      </Text>
      {children}
    </View>
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
      gap: 10,
    },
    screenTitle: {
      fontSize: 26,
      fontFamily: "Inter_700Bold",
      color: colors.foreground,
    },
    screenSubtitle: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
    },
    tabRow: {
      flexDirection: "row",
      borderRadius: 10,
      borderWidth: 1,
      padding: 3,
      alignSelf: "flex-start",
    },
    tabBtn: {
      paddingHorizontal: 16,
      paddingVertical: 6,
      borderRadius: 8,
    },
    tabBtnText: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
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
