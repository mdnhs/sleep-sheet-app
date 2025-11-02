import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { updateOrder } from "@/api/updateOrder";
import { FilterModal } from "@/components/FilterModal";
import { OrderCard } from "@/components/OrderCard";
import { useOrders } from "@/hooks/useOrders";
import { Filters } from "@/types/order";

export default function HomeScreen() {
  const [filters, setFilters] = useState<Filters>({
    status: "all",
    deliveryStatus: "all",
    paymentStatus: "all",
  });

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);

  const { orders, loading, refetch } = useOrders(filters);

  const handleStatusUpdate = async (
    id: string,
    field: string,
    newStatus: string
  ) => {
    const result = await updateOrder(id, { [field]: newStatus });
    if (result.success) {
      setStatusDropdown(null);
      refetch();
    }
  };

  const resetFilters = () => {
    setFilters({
      status: "all",
      deliveryStatus: "all",
      paymentStatus: "all",
    });
    setFilterModalVisible(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F9FAFB" }}>
      <StatusBar barStyle="dark-content" backgroundColor="#F9FAFB" />

      {/* Header */}
      <View
        style={{
          backgroundColor: "white",
          paddingTop: 50,
          paddingBottom: 16,
          paddingHorizontal: 16,
          borderBottomWidth: 1,
          borderBottomColor: "#E5E7EB",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ fontSize: 28, fontWeight: "700", color: "#111827" }}>
            Orders
          </Text>
          <TouchableOpacity
            onPress={() => setFilterModalVisible(true)}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              backgroundColor: "#3B82F6",
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 10,
            }}
          >
            <Feather name="filter" size={16} color="white" />
            <Text style={{ color: "white", fontWeight: "600", fontSize: 14 }}>
              Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Orders List */}
      {loading ? (
        <View
          style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ marginTop: 12, color: "#6B7280", fontSize: 14 }}>
            Loading orders...
          </Text>
        </View>
      ) : orders.length > 0 ? (
        <FlatList
          data={orders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <OrderCard
              item={item}
              statusDropdown={statusDropdown}
              setStatusDropdown={setStatusDropdown}
              onStatusUpdate={handleStatusUpdate}
            />
          )}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
            paddingHorizontal: 32,
          }}
        >
          <Feather name="package" size={64} color="#D1D5DB" />
          <Text
            style={{
              fontSize: 18,
              fontWeight: "600",
              color: "#374151",
              marginTop: 16,
            }}
          >
            No orders found
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: "#9CA3AF",
              marginTop: 4,
              textAlign: "center",
            }}
          >
            Try adjusting your filters to see more orders
          </Text>
        </View>
      )}

      {/* Filter Modal */}
      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
      />
    </View>
  );
}
