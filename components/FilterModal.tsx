import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/orderStatuses";
import { Filters } from "@/types/order";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Modal, ScrollView, Text, TouchableOpacity, View } from "react-native";

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onReset: () => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  filters,
  setFilters,
  onReset,
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="slide"
    onRequestClose={onClose}
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
          <Text style={{ fontSize: 20, fontWeight: "700", color: "#111827" }}>
            Filter Orders
          </Text>
          <TouchableOpacity onPress={onClose}>
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                      color: filters.status === status ? "white" : "#374151",
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                      filters.deliveryStatus === status ? "#06B6D4" : "#F3F4F6",
                    borderWidth: 1,
                    borderColor:
                      filters.deliveryStatus === status ? "#06B6D4" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      color:
                        filters.deliveryStatus === status ? "white" : "#374151",
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
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
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
                      filters.paymentStatus === status ? "#10B981" : "#F3F4F6",
                    borderWidth: 1,
                    borderColor:
                      filters.paymentStatus === status ? "#10B981" : "#E5E7EB",
                  }}
                >
                  <Text
                    style={{
                      color:
                        filters.paymentStatus === status ? "white" : "#374151",
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
            onPress={onReset}
            style={{
              backgroundColor: "#F3F4F6",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
              borderWidth: 1,
              borderColor: "#E5E7EB",
            }}
          >
            <Text style={{ color: "#374151", fontWeight: "600", fontSize: 15 }}>
              Reset Filters
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={onClose}
            style={{
              backgroundColor: "#3B82F6",
              padding: 14,
              borderRadius: 12,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600", fontSize: 15 }}>
              Apply Filters
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);
