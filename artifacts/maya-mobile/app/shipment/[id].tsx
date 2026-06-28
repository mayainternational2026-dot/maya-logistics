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

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[detailStyles.infoRow, { borderBottomColor: colors.border }]}>
      <Text style={[detailStyles.infoLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[detailStyles.infoValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

const detailStyles = StyleSheet.create({
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

export default function ShipmentDetailScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const isWeb = Platform.OS === "web";

  const { data: shipment, isLoading, isError, refetch } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => api.getShipment(Number(id)),
    enabled: !!id,
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
        <Text style={styles.headerTitle}>Shipment Detail</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError || !shipment ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
          <Text style={[styles.errorText, { color: colors.foreground }]}>
            Shipment not found
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryLabel, { color: colors.primary }]}>Retry</Text>
          </Pressable>
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
              Shipment Details
            </Text>
            <InfoRow label="Sender" value={shipment.senderName} colors={colors} />
            <InfoRow label="Receiver" value={shipment.receiverName} colors={colors} />
            <InfoRow
              label="Weight"
              value={`${Number(shipment.weight).toFixed(2)} kg`}
              colors={colors}
            />
            <InfoRow
              label="Cost"
              value={`NPR ${Number(shipment.cost).toLocaleString()}`}
              colors={colors}
            />
            <InfoRow
              label="Payment"
              value={shipment.paid ? "Paid" : "Pending"}
              colors={colors}
            />
            {shipment.serviceType && (
              <InfoRow label="Service" value={shipment.serviceType} colors={colors} />
            )}
            <InfoRow
              label="Booked"
              value={new Date(shipment.createdAt).toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
              colors={colors}
            />
          </View>

          {shipment.description && (
            <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Description
              </Text>
              <Text style={[styles.descriptionText, { color: colors.mutedForeground }]}>
                {shipment.description}
              </Text>
            </View>
          )}
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
      gap: 12,
    },
    errorText: {
      fontSize: 16,
      fontFamily: "Inter_500Medium",
    },
    retryBtn: {
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    retryLabel: {
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
    descriptionText: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      lineHeight: 22,
    },
  });
}
