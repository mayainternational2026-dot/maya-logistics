import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
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
  customs_clearance: "Customs",
  in_transit: "In Transit",
  arrived: "Arrived",
  delivered: "Delivered",
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

function StatusBadge({ status }: { status: ShipmentStatus }) {
  const color = STATUS_COLORS[status] ?? "#94A3B8";
  return (
    <View style={[badgeStyles.badge, { backgroundColor: `${color}20` }]}>
      <View style={[badgeStyles.dot, { backgroundColor: color }]} />
      <Text style={[badgeStyles.text, { color }]}>{STATUS_LABELS[status] ?? status}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 20,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  text: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
});

interface ShipmentCardProps {
  item: Shipment;
  onPress: () => void;
  colors: ReturnType<typeof useColors>;
}

function ShipmentCard({ item, onPress, colors }: ShipmentCardProps) {
  const progress = (STATUS_ORDER.indexOf(item.status) + 1) / STATUS_ORDER.length;
  const statusColor = STATUS_COLORS[item.status] ?? "#94A3B8";

  return (
    <Pressable
      testID="shipment-card"
      onPress={() => {
        Haptics.selectionAsync();
        onPress();
      }}
      style={({ pressed }) => [
        cardStyles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.95 : 1,
        },
      ]}
    >
      <View style={cardStyles.header}>
        <View>
          <Text style={[cardStyles.trackingId, { color: colors.primary }]}>
            {item.trackingId}
          </Text>
          <Text style={[cardStyles.route, { color: colors.foreground }]}>
            {item.origin} → {item.destination}
          </Text>
        </View>
        <StatusBadge status={item.status} />
      </View>

      <View style={cardStyles.progressBarBg}>
        <View
          style={[
            cardStyles.progressBarFill,
            { width: `${progress * 100}%` as any, backgroundColor: statusColor },
          ]}
        />
      </View>

      <View style={cardStyles.footer}>
        <Text style={[cardStyles.meta, { color: colors.mutedForeground }]}>
          {new Date(item.createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </Text>
        <Text style={[cardStyles.meta, { color: colors.mutedForeground }]}>
          {Number(item.weight).toFixed(1)} kg · NPR {Number(item.cost).toLocaleString()}
        </Text>
      </View>
    </Pressable>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  trackingId: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  route: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  progressBarBg: {
    height: 4,
    backgroundColor: "#E5EAF2",
    borderRadius: 2,
    marginBottom: 12,
    overflow: "hidden",
  },
  progressBarFill: {
    height: 4,
    borderRadius: 2,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  meta: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});

export default function ShipmentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const isWeb = Platform.OS === "web";

  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const {
    data: shipments,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["shipments"],
    queryFn: () => api.listShipments(),
    retry: 1,
  });

  const filtered = (shipments ?? []).filter((s) => {
    const matchFilter =
      activeFilter === "all" ||
      (activeFilter === "active" &&
        !["delivered"].includes(s.status)) ||
      s.status === activeFilter;
    const matchSearch =
      !search ||
      s.trackingId.toLowerCase().includes(search.toLowerCase()) ||
      s.origin.toLowerCase().includes(search.toLowerCase()) ||
      s.destination.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const styles = makeStyles(colors, insets, isWeb);

  const filterOptions = [
    { key: "all", label: "All" },
    { key: "active", label: "Active" },
    { key: "in_transit", label: "In Transit" },
    { key: "delivered", label: "Delivered" },
  ];

  return (
    <View style={styles.root}>
      <View style={styles.topBar}>
        <Text style={styles.screenTitle}>My Shipments</Text>
        <View style={styles.searchRow}>
          <Feather name="search" size={16} color={colors.mutedForeground} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground }]}
            placeholder="Search tracking ID, route…"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
            autoCorrect={false}
            testID="search-input"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")} style={styles.clearBtn}>
              <Feather name="x" size={14} color={colors.mutedForeground} />
            </Pressable>
          )}
        </View>
        <View style={styles.filterRow}>
          {filterOptions.map((f) => (
            <Pressable
              key={f.key}
              onPress={() => {
                setActiveFilter(f.key);
                Haptics.selectionAsync();
              }}
              style={[
                styles.filterChip,
                activeFilter === f.key && {
                  backgroundColor: colors.primary,
                  borderColor: colors.primary,
                },
              ]}
            >
              <Text
                style={[
                  styles.filterChipText,
                  { color: activeFilter === f.key ? "#FFFFFF" : colors.mutedForeground },
                ]}
              >
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : isError ? (
        <View style={styles.center}>
          <Feather name="alert-circle" size={36} color={colors.mutedForeground} />
          <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
            Unable to load shipments
          </Text>
          <Pressable
            onPress={() => refetch()}
            style={[styles.retryBtn, { borderColor: colors.border }]}
          >
            <Text style={[styles.retryText, { color: colors.primary }]}>Try again</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <ShipmentCard
              item={item}
              colors={colors}
              onPress={() => router.push(`/shipment/${item.id}` as any)}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={refetch}
              tintColor={colors.primary}
            />
          }
          contentContainerStyle={[
            styles.listContent,
            filtered.length === 0 && styles.listEmpty,
          ]}
          scrollEnabled={!!filtered.length}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="inbox" size={44} color={colors.mutedForeground} />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                No shipments found
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {search
                  ? "Try a different search term"
                  : "Your shipments will appear here"}
              </Text>
            </View>
          }
        />
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
      marginBottom: 12,
    },
    searchRow: {
      flexDirection: "row",
      alignItems: "center",
      backgroundColor: colors.surface,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
      paddingHorizontal: 12,
      height: 40,
      marginBottom: 10,
    },
    searchIcon: {
      marginRight: 8,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      height: "100%",
    },
    clearBtn: {
      padding: 4,
    },
    filterRow: {
      flexDirection: "row",
      gap: 8,
    },
    filterChip: {
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    filterChipText: {
      fontSize: 12,
      fontFamily: "Inter_500Medium",
    },
    listContent: {
      paddingTop: 10,
      paddingBottom: isWeb ? 34 : insets.bottom + 80,
    },
    listEmpty: {
      flex: 1,
    },
    center: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 12,
    },
    emptyState: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      paddingTop: 80,
    },
    emptyTitle: {
      fontSize: 18,
      fontFamily: "Inter_600SemiBold",
      marginTop: 8,
    },
    emptySubtitle: {
      fontSize: 14,
      fontFamily: "Inter_400Regular",
      textAlign: "center",
    },
    retryBtn: {
      marginTop: 4,
      paddingHorizontal: 20,
      paddingVertical: 10,
      borderRadius: 20,
      borderWidth: 1,
    },
    retryText: {
      fontSize: 14,
      fontFamily: "Inter_500Medium",
    },
  });
}
