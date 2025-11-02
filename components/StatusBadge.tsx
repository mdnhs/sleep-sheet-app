import { getStatusColor, getStatusIcon } from "@/utils/statusUtils";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Text, View } from "react-native";

interface StatusBadgeProps {
  status: string;
  type?: "order" | "payment" | "delivery";
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = "order",
}) => (
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
