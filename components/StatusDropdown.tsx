import { Feather } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface StatusDropdownProps {
  orderId: string;
  currentStatus: string;
  field: string;
  options: string[];
  onSelect: (orderId: string, field: string, newStatus: string) => void;
  visible: boolean;
  onClose: () => void;
}

export const StatusDropdown: React.FC<StatusDropdownProps> = ({
  orderId,
  currentStatus,
  field,
  options,
  onSelect,
  visible,
  onClose,
}) => (
  <Modal
    transparent
    visible={visible}
    onRequestClose={onClose}
    animationType="fade"
  >
    <Pressable
      style={{
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.5)",
        justifyContent: "center",
        alignItems: "center",
      }}
      onPress={onClose}
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
