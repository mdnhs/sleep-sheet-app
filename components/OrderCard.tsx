import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/orderStatuses";
import { Order } from "@/types/order";
import { Feather } from "@expo/vector-icons";
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
}) => (
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
        ৳ {item.totalPrice.toLocaleString()}
      </Text>
    </View>

    {/* Status Badges with Dropdowns */}
    <View style={{ gap: 8, marginBottom: 16 }}>
      <TouchableOpacity
        onPress={() => setStatusDropdown(`${item._id}-status`)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#F9FAFB",
          padding: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
            Order
          </Text>
          <StatusBadge status={item.status} type="order" />
        </View>
        <Feather name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStatusDropdown(`${item._id}-paymentStatus`)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#F9FAFB",
          padding: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
            Payment
          </Text>
          <StatusBadge status={item.paymentStatus} type="payment" />
        </View>
        <Feather name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => setStatusDropdown(`${item._id}-deliveryStatus`)}
        style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#F9FAFB",
          padding: 10,
          borderRadius: 10,
          borderWidth: 1,
          borderColor: "#E5E7EB",
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 12, color: "#6B7280", fontWeight: "500" }}>
            Delivery
          </Text>
          <StatusBadge status={item.deliveryStatus} type="delivery" />
        </View>
        <Feather name="chevron-down" size={16} color="#9CA3AF" />
      </TouchableOpacity>
    </View>

    {/* Products Summary */}
    <View
      style={{
        backgroundColor: "#FAFAFA",
        padding: 10,
        borderRadius: 8,
        borderWidth: 1,
        borderColor: "#E5E7EB",
      }}
    >
      <Text
        style={{
          fontSize: 11,
          color: "#6B7280",
          fontWeight: "600",
          marginBottom: 4,
        }}
      >
        PRODUCTS ({item.products?.length || 0})
      </Text>
      {item.products?.slice(0, 2).map((product, idx) => (
        <Text key={idx} style={{ fontSize: 12, color: "#374151" }}>
          • {product.name} (x{product.quantity})
        </Text>
      ))}
      {item.products?.length > 2 && (
        <Text style={{ fontSize: 11, color: "#9CA3AF", marginTop: 2 }}>
          +{item.products.length - 2} more...
        </Text>
      )}
    </View>

    {/* Status Dropdowns */}
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
