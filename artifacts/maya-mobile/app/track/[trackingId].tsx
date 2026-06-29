import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQuery } from "@tanstack/react-query";
import { api, type Shipment, type ShipmentStatus } from "@/lib/api";
import { useColors } from "@/hooks/useColors";

const STATUS_LABELS: Record<ShipmentStatus, string> = {
  pending: "Pending",
  collected: "Collected",
  at_warehouse: "At Warehouse",
  customs_clearance: "Customs Clearance",
  in_transit: "In Transit",
  arrived: "Arrived",
  delivered: "Delivered",
};

const STATUS_DESCRIPTIONS: Record<ShipmentStatus, string> = {
  pending: "Your shipment has been booked and is awaiting pickup.",
  collected: "Your package has been picked up and is being processed.",
  at_warehouse: "Your shipment is at our warehouse being prepared.",
  customs_clearance: "Your shipment is currently going through customs.",
  in_transit: "Your shipment is on its way to the destination.",
  arrived: "Your shipment has arrived at the destination city.",
  delivered: "Your shipment has been successfully delivered.",
};

const STATUS_ICONS: Record<ShipmentStatus, string> = {
  pending: "clock",
  collected: "package",
  at_warehouse: "home",
  customs_clearance: "file-text",
  in_transit: "truck",
  arrived: "map-pin",
  delivered: "check-circle",
};

const STATUS_COLORS: Record<ShipmentStatus, string> = {
  pending: "#94A3B8",
  collected: "#F59E0B",
  at_warehouse: "#6366F1",
  customs_clearance: "#8B5CF6",
  in_transit: "#3B82F6",
  arrived: "#10B981",
  delivered: "#22C55E",
};

const STATUS_ORDER: ShipmentStatus[] = [
  "pending",
  "collected",
  "at_warehouse",
  "customs_clearance",
  "in_transit",
  "arrived",
  "delivered",
];

function StatusTimeline({ shipment, colors }: { shipment: Shipment; colors: ReturnType<typeof useColors> }) {
  const currentIndex = STATUS_ORDER.indexOf(shipment.status);
  return (
    <View style={timelineStyles.container}>
      {STATUS_ORDER.map((status, index) => {
        const isDone = index <= currentIndex;
        const isCurrent = index === currentIndex;
        const color = isDone ? STATUS_COLORS[status] : colors.border;
        const isLast = index === STATUS_ORDER.length - 1;

        return (
          <View key={status} style={timelineStyles.row}>
            <View style={timelineStyles.leftCol}>
              <View
                style={[
                  timelineStyles.circle,
                  {
                    backgroundColor: isDone ? color : colors.surface,
                    borderColor: isDone ? color : colors.border,
                    borderWidth: isDone ? 0 : 2,
                  },
                ]}
              >
                {isDone ? (
                  <Feather
                    name={STATUS_ICONS[status] as any}
                    size={12}
                    color="#FFFFFF"
                  />
                ) : null}
              </View>
              {!isLast && (
                <View
                  style={[
                    timelineStyles.line,
                    { backgroundColor: index < currentIndex ? color : colors.border },
                  ]}
                />
              )}
            </View>
            <View style={[timelineStyles.content, !isLast && { paddingBottom: 20 }]}>
              <Text
                style={[
                  timelineStyles.label,
                  { color: isDone ? colors.foreground : colors.mutedForeground },
                  isCurrent && { color },
                ]}
              >
                {STATUS_LABELS[status]}
              </Text>
              {isCurrent && (
                <Text style={[timelineStyles.desc, { color: colors.mutedForeground }]}>
                  {STATUS_DESCRIPTIONS[status]}
                </Text>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const timelineStyles = StyleSheet.create({
  container: {
    paddingTop: 4,
  },
  row: {
    flexDirection: "row",
    gap: 12,
  },
  leftCol: {
    alignItems: "center",
    width: 28,
  },
  circle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  line: {
    width: 2,
    flex: 1,
    marginTop: 4,
  },
  content: {
    flex: 1,
    paddingTop: 4,
  },
  label: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  desc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    lineHeight: 18,
  },
});

export default function PublicTrackScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { trackingId } = useLocalSearchParams<{ trackingId: string }>();
  const isWeb = Platform.OS === "web";

  const { data: shipment, isLoading, isError, refetch } = useQuery({
    queryKey: ["track", trackingId],
    queryFn: () => api.trackShipment(trackingId),
    enabled: !!trackingId,
    retry: 1,
  });

  const styles = makeStyles(colors, insets, isWeb);

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
          testID="back-button"
        >
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={styles.headerTitle}>Track Shipment</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
            Looking up your shipment…
          </Text>
        </View>
      ) : isError || !shipment ? (
        <View style={styles.center}>
          <View style={[styles.iconCircle, { backgroundColor: `${colors.destructive}15` }]}>
            <Feather name="search" size={32} color={colors.mutedForeground} />
          </View>
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>
            Shipment not found
          </Text>
          <Text style={[styles.notFoundDesc, { color: colors.mutedForeground }]}>
            No shipment matched tracking ID:{"\n"}
            <Text style={{ fontFamily: "Inter_600SemiBold" }}>{trackingId}</Text>
          </Text>
          <View style={styles.centerActions}>
            <Pressable
              onPress={() => refetch()}
              style={[styles.retryBtn, { borderColor: colors.primary }]}
            >
              <Feather name="refresh-cw" size={14} color={colors.primary} />
              <Text style={[styles.retryLabel, { color: colors.primary }]}>Retry</Text>
            </Pressable>
            <Pressable
              onPress={() => router.back()}
              style={[styles.backSearchBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
            >
              <Text style={[styles.backSearchLabel, { color: colors.foreground }]}>Try another ID</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.trackingRow}>
              <View>
                <Text style={[styles.trackingLabel, { color: colors.mutedForeground }]}>
                  Tracking ID
                </Text>
                <Text style={[styles.trackingId, { color: colors.primary }]}>
                  {shipment.trackingId}
                </Text>
              </View>
              <View
                style={[
                  styles.statusPill,
                  { backgroundColor: `${STATUS_COLORS[shipment.status]}20` },
                ]}
              >
                <Text style={[styles.statusPillText, { color: STATUS_COLORS[shipment.status] }]}>
                  {STATUS_LABELS[shipment.status]}
                </Text>
              </View>
            </View>

            <View style={styles.routeBlock}>
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: colors.primary }]} />
                <Text style={[styles.routeCity, { color: colors.foreground }]}>
                  {shipment.origin}
                </Text>
              </View>
              <View style={[styles.routeLine, { backgroundColor: colors.border }]} />
              <View style={styles.routePoint}>
                <View style={[styles.routeDot, { backgroundColor: STATUS_COLORS[shipment.status] }]} />
                <Text style={[styles.routeCity, { color: colors.foreground }]}>
                  {shipment.destination}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Tracking Timeline
            </Text>
            <StatusTimeline shipment={shipment} colors={colors} />
          </View>

          <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Shipment Info
            </Text>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Sender</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{shipment.senderName}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Receiver</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{shipment.receiverName}</Text>
            </View>
            <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Weight</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>{Number(shipment.weight).toFixed(2)} kg</Text>
            </View>
            {shipment.serviceType && (
              <View style={[styles.infoRow, { borderBottomColor: colors.border }]}>
                <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Service</Text>
                <Text style={[styles.infoValue, { color: colors.foreground }]}>{shipment.serviceType}</Text>
              </View>
            )}
            <View style={[styles.infoRow, { borderBottomColor: colors.border, borderBottomWidth: 0 }]}>
              <Text style={[styles.infoLabel, { color: colors.mutedForeground }]}>Booked</Text>
              <Text style={[styles.infoValue, { color: colors.foreground }]}>
                {new Date(shipment.createdAt).toLocaleDateString("en-US", {
                  weekday: "short",
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </Text>
            </View>
          </View>
        </ScrollView>
      )}
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useColors>, insets: ReturnType<typeof useSafeAreaInsets>, isWeb: boolean) {
  return StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      paddingTop: isWeb ? insets.top + 67 : insets.top + 12,
      paddingBottom: 12,
      paddingHorizontal: 16,
      backgroundColor: colors.background,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
    },
    backBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface,
      alignItems: "center",
      justifyContent: "center",
    },
    headerTitle: {
      fontSize: 17,
      fontFamily: "Inter_600SemiBold",
      color: colors.foreground,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 32,
      gap: 12,
    },
    iconCircle: {
      width: 72,
      height: 72,
      borderRadius: 36,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 4,
    },
    loadingText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      marginTop: 8,
    },
    notFoundTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      textAlign: "center",
    },
    notFoundDesc: {
      fontSize: 13,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
      lineHeight: 20,
    },
    centerActions: {
      flexDirection: "row",
      gap: 10,
      marginTop: 8,
    },
    retryBtn: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    retryLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    backSearchBtn: {
      paddingHorizontal: 18,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    backSearchLabel: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
    scrollContent: {
      padding: 16,
      paddingBottom: isWeb ? 34 : insets.bottom + 32,
      gap: 12,
    },
    card: {
      borderRadius: 14,
      borderWidth: 1,
      padding: 16,
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    trackingRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "flex-start",
      marginBottom: 16,
    },
    trackingLabel: {
      fontSize: 11,
      fontFamily: "Inter_500Medium",
      textTransform: "uppercase",
      letterSpacing: 0.5,
      marginBottom: 4,
    },
    trackingId: {
      fontSize: 18,
      fontFamily: "Inter_700Bold",
      letterSpacing: 0.5,
    },
    statusPill: {
      paddingHorizontal: 10,
      paddingVertical: 5,
      borderRadius: 20,
    },
    statusPillText: {
      fontSize: 12,
      fontFamily: "Inter_600SemiBold",
    },
    routeBlock: {
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
    },
    routePoint: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      flex: 1,
    },
    routeDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
    },
    routeCity: {
      fontSize: 15,
      fontFamily: "Inter_600SemiBold",
      flex: 1,
    },
    routeLine: {
      height: 1,
      width: 20,
    },
    sectionTitle: {
      fontSize: 16,
      fontFamily: "Inter_600SemiBold",
      marginBottom: 16,
    },
    infoRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingVertical: 12,
      borderBottomWidth: 1,
    },
    infoLabel: {
      fontSize: 13,
      fontFamily: "Inter_500Medium",
      flex: 1,
    },
    infoValue: {
      fontSize: 13,
      fontFamily: "Inter_600SemiBold",
      textAlign: "right",
      flex: 1,
    },
  });
}
