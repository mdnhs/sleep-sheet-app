import { updateOrder } from "@/api/updateOrder";
import { useOrders } from "@/hooks/useOrders";
import { Feather } from "@expo/vector-icons";
import React, { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HomeScreen() {
  const [filters, setFilters] = useState({
    status: "all",
    deliveryStatus: "all",
    paymentStatus: "all",
  });

  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState(null);

  const { orders, loading, refetch } = useOrders(filters);

  const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  const DELIVERY_STATUSES = ["pending", "out_for_delivery", "delivered"];
  const PAYMENT_STATUSES = ["pending", "received"];

  const handleStatusUpdate = async (id, field, newStatus) => {
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

  const getStatusColor = (status, type = "order") => {
    const colors = {
      order: {
        pending: "#F59E0B",
        confirmed: "#3B82F6",
        processing: "#8B5CF6",
        shipped: "#06B6D4",
        delivered: "#10B981",
        cancelled: "#EF4444",
      },
      payment: {
        pending: "#F59E0B",
        received: "#10B981",
      },
      delivery: {
        pending: "#F59E0B",
        out_for_delivery: "#3B82F6",
        delivered: "#10B981",
      },
    };
    return colors[type]?.[status] || "#6B7280";
  };

  const getStatusIcon = (status, type) => {
    if (type === "order") {
      if (status === "delivered") return "check-circle";
      if (status === "cancelled") return "x-circle";
      return "package";
    }
    if (type === "delivery") return "truck";
    if (type === "payment") return "credit-card";
    return "clock";
  };

  const StatusBadge = ({ status, type = "order" }) => (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: getStatusColor(status, type),
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
      }}
    >
      <Feather name={getStatusIcon(status, type)} size={14} color="white" />
      <Text
        style={{
          color: "white",
          fontSize: 11,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {status.replace("_", " ")}
      </Text>
    </View>
  );

  const StatusDropdown = ({
    orderId,
    currentStatus,
    field,
    options,
    onSelect,
  }) => (
    <Modal
      transparent
      visible={statusDropdown === `${orderId}-${field}`}
      onRequestClose={() => setStatusDropdown(null)}
      animationType="fade"
    >
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
          justifyContent: "center",
          alignItems: "center",
        }}
        onPress={() => setStatusDropdown(null)}
      >
        <View
          style={{
            backgroundColor: "white",
            borderRadius: 16,
            padding: 4,
            width: "80%",
            maxWidth: 300,
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
            elevation: 8,
          }}
        >
          <View
            style={{
              padding: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#E5E7EB",
            }}
          >
            <Text style={{ fontSize: 16, fontWeight: "600", color: "#111827" }}>
              Update{" "}
              {field === "status"
                ? "Order"
                : field === "paymentStatus"
                ? "Payment"
                : "Delivery"}{" "}
              Status
            </Text>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option}
                onPress={() => onSelect(orderId, field, option)}
                style={{
                  padding: 14,
                  borderBottomWidth: 1,
                  borderBottomColor: "#F3F4F6",
                  backgroundColor:
                    option === currentStatus ? "#F0F9FF" : "transparent",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 14,
                      color: option === currentStatus ? "#0284C7" : "#374151",
                      fontWeight: option === currentStatus ? "600" : "400",
                      textTransform: "capitalize",
                    }}
                  >
                    {option.replace("_", " ")}
                  </Text>
                  {option === currentStatus && (
                    <Feather name="check-circle" size={18} color="#0284C7" />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </Pressable>
    </Modal>
  );

  const OrderCard = ({ item }) => (
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
        onSelect={handleStatusUpdate}
      />
      <StatusDropdown
        orderId={item._id}
        currentStatus={item.paymentStatus}
        field="paymentStatus"
        options={PAYMENT_STATUSES}
        onSelect={handleStatusUpdate}
      />
      <StatusDropdown
        orderId={item._id}
        currentStatus={item.deliveryStatus}
        field="deliveryStatus"
        options={DELIVERY_STATUSES}
        onSelect={handleStatusUpdate}
      />
    </View>
  );

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
          renderItem={({ item }) => <OrderCard item={item} />}
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
      <Modal
        visible={filterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.5)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: "white",
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 20,
              paddingBottom: 40,
              maxHeight: "80%",
            }}
          >
            {/* Modal Header */}
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                paddingHorizontal: 20,
                paddingBottom: 16,
                borderBottomWidth: 1,
                borderBottomColor: "#E5E7EB",
              }}
            >
              <Text
                style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}
              >
                Filter Orders
              </Text>
              <TouchableOpacity onPress={() => setFilterModalVisible(false)}>
                <Feather name="x" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ paddingHorizontal: 20, paddingTop: 20 }}>
              {/* Order Status Filter */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 8,
                  }}
                >
                  ORDER STATUS
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {["all", ...ORDER_STATUSES].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() => setFilters({ ...filters, status })}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          filters.status === status ? "#3B82F6" : "#F3F4F6",
                        borderWidth: 1,
                        borderColor:
                          filters.status === status ? "#3B82F6" : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            filters.status === status ? "white" : "#374151",
                          fontWeight: filters.status === status ? "600" : "400",
                          fontSize: 13,
                          textTransform: "capitalize",
                        }}
                      >
                        {status === "all" ? "All" : status.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Delivery Status Filter */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 8,
                  }}
                >
                  DELIVERY STATUS
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {["all", ...DELIVERY_STATUSES].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() =>
                        setFilters({ ...filters, deliveryStatus: status })
                      }
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          filters.deliveryStatus === status
                            ? "#06B6D4"
                            : "#F3F4F6",
                        borderWidth: 1,
                        borderColor:
                          filters.deliveryStatus === status
                            ? "#06B6D4"
                            : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            filters.deliveryStatus === status
                              ? "white"
                              : "#374151",
                          fontWeight:
                            filters.deliveryStatus === status ? "600" : "400",
                          fontSize: 13,
                          textTransform: "capitalize",
                        }}
                      >
                        {status === "all" ? "All" : status.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Payment Status Filter */}
              <View style={{ marginBottom: 24 }}>
                <Text
                  style={{
                    fontSize: 13,
                    fontWeight: "600",
                    color: "#6B7280",
                    marginBottom: 8,
                  }}
                >
                  PAYMENT STATUS
                </Text>
                <View
                  style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}
                >
                  {["all", ...PAYMENT_STATUSES].map((status) => (
                    <TouchableOpacity
                      key={status}
                      onPress={() =>
                        setFilters({ ...filters, paymentStatus: status })
                      }
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 20,
                        backgroundColor:
                          filters.paymentStatus === status
                            ? "#10B981"
                            : "#F3F4F6",
                        borderWidth: 1,
                        borderColor:
                          filters.paymentStatus === status
                            ? "#10B981"
                            : "#E5E7EB",
                      }}
                    >
                      <Text
                        style={{
                          color:
                            filters.paymentStatus === status
                              ? "white"
                              : "#374151",
                          fontWeight:
                            filters.paymentStatus === status ? "600" : "400",
                          fontSize: 13,
                          textTransform: "capitalize",
                        }}
                      >
                        {status === "all" ? "All" : status.replace("_", " ")}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Footer Buttons */}
            <View style={{ paddingHorizontal: 20, paddingTop: 16, gap: 10 }}>
              <TouchableOpacity
                onPress={resetFilters}
                style={{
                  backgroundColor: "#F3F4F6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text
                  style={{ color: "#374151", fontWeight: "600", fontSize: 15 }}
                >
                  Reset Filters
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterModalVisible(false)}
                style={{
                  backgroundColor: "#3B82F6",
                  padding: 14,
                  borderRadius: 12,
                  alignItems: "center",
                }}
              >
                <Text
                  style={{ color: "white", fontWeight: "600", fontSize: 15 }}
                >
                  Apply Filters
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
