import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/orderStatuses";
import { Order } from "@/types/order";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { StatusBadge } from "./StatusBadge";
import { StatusDropdown } from "./StatusDropdown";

interface OrderCardProps {
  item: Order;
  statusDropdown: string | null;
  setStatusDropdown: (value: string | null) => void;
  onStatusUpdate: (id: string, field: string, newStatus: string) => void;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  item,
  statusDropdown,
  setStatusDropdown,
  onStatusUpdate,
}) => {
  // Extract first product safely
  const firstProduct = item.products?.[0]?.product || item.products?.[0];
  const firstImage = firstProduct?.image;
  const firstName = firstProduct?.name;
  const firstQty = item.products?.[0]?.quantity || 1;

  return (
    <View
      style={{
        backgroundColor: "white",
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: "#F3F4F6",
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 12 }}>
        <Text
          style={{
            fontSize: 18,
            fontWeight: "700",
            color: "#111827",
            marginBottom: 4,
          }}
        >
          {item.customerName}
        </Text>
        <Text style={{ fontSize: 13, color: "#6B7280" }}>
          {item.customerPhone}
        </Text>
      </View>

      {/* Product Image + Title */}
      {firstImage && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            marginBottom: 12,
            gap: 12,
          }}
        >
          <Image
            source={{ uri: firstImage }}
            style={{
              width: 60,
              height: 60,
              borderRadius: 8,
              backgroundColor: "#F3F4F6",
            }}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 14,
                fontWeight: "600",
                color: "#111827",
              }}
              numberOfLines={1}
            >
              {firstName || "Unnamed Product"}
            </Text>
            <Text style={{ fontSize: 12, color: "#6B7280" }}>
              {firstQty} pcs
            </Text>
          </View>
        </View>
      )}

      {/* Price */}
      <View
        style={{
          backgroundColor: "#F0FDF4",
          padding: 12,
          borderRadius: 12,
          marginBottom: 12,
          borderWidth: 1,
          borderColor: "#BBF7D0",
        }}
      >
        <Text style={{ fontSize: 13, color: "#15803D", marginBottom: 2 }}>
          Total Amount
        </Text>
        <Text style={{ fontSize: 24, fontWeight: "700", color: "#166534" }}>
          ৳ {item.totalPrice?.toLocaleString()}
        </Text>
      </View>

      {/* Status Badges with Dropdowns */}
      <View style={{ gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-status`)}
          style={styles.dropdownRow}
        >
          <View style={styles.dropdownLabel}>
            <Text style={styles.dropdownText}>Order</Text>
            <StatusBadge status={item.status} type="order" />
          </View>
          <Feather name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-paymentStatus`)}
          style={styles.dropdownRow}
        >
          <View style={styles.dropdownLabel}>
            <Text style={styles.dropdownText}>Payment</Text>
            <StatusBadge status={item.paymentStatus} type="payment" />
          </View>
          <Feather name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-deliveryStatus`)}
          style={styles.dropdownRow}
        >
          <View style={styles.dropdownLabel}>
            <Text style={styles.dropdownText}>Delivery</Text>
            <StatusBadge status={item.deliveryStatus} type="delivery" />
          </View>
          <Feather name="chevron-down" size={16} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Dropdowns */}
      <StatusDropdown
        orderId={item._id}
        currentStatus={item.status}
        field="status"
        options={ORDER_STATUSES}
        onSelect={onStatusUpdate}
        visible={statusDropdown === `${item._id}-status`}
        onClose={() => setStatusDropdown(null)}
      />
      <StatusDropdown
        orderId={item._id}
        currentStatus={item.paymentStatus}
        field="paymentStatus"
        options={PAYMENT_STATUSES}
        onSelect={onStatusUpdate}
        visible={statusDropdown === `${item._id}-paymentStatus`}
        onClose={() => setStatusDropdown(null)}
      />
      <StatusDropdown
        orderId={item._id}
        currentStatus={item.deliveryStatus}
        field="deliveryStatus"
        options={DELIVERY_STATUSES}
        onSelect={onStatusUpdate}
        visible={statusDropdown === `${item._id}-deliveryStatus`}
        onClose={() => setStatusDropdown(null)}
      />
    </View>
  );
};

const styles = {
  dropdownRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: "#F9FAFB",
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  dropdownLabel: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  dropdownText: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500" as const,
  },
};
