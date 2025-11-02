export const getStatusColor = (status: string, type: string = "order") => {
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
  return colors[type as keyof typeof colors]?.[status] || "#6B7280";
};

export const getStatusIcon = (status: string, type: string) => {
  if (type === "order") {
    if (status === "delivered") return "check-circle";
    if (status === "cancelled") return "x-circle";
    return "package";
  }
  if (type === "delivery") return "truck";
  if (type === "payment") return "credit-card";
  return "clock";
};
