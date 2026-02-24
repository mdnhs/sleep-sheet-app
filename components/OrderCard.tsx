import {
  DELIVERY_STATUSES,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
} from "@/constants/orderStatuses";
import { Order } from "@/types/order";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useState } from "react";
import Toast from "react-native-toast-message";
import {
  Alert,
  Platform,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";
import * as Clipboard from "expo-clipboard";
import * as FileSystem from "expo-file-system";
import * as IntentLauncher from "expo-intent-launcher";
import { StatusBadge } from "./StatusBadge";
import { StatusDropdown } from "./StatusDropdown";
import { useThemePreference } from "@/context/theme-preference";

interface OrderCardProps {
  item: Order;
  statusDropdown: string | null;
  setStatusDropdown: (value: string | null) => void;
  onStatusUpdate: (id: string, field: string, newStatus: string) => void;
  showInvoiceActions?: boolean;
}

export const OrderCard: React.FC<OrderCardProps> = ({
  item,
  statusDropdown,
  setStatusDropdown,
  onStatusUpdate,
  showInvoiceActions = false,
}) => {
  const products = Array.isArray(item.products) ? item.products : [];
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const { resolvedScheme } = useThemePreference();
  const isDark = resolvedScheme === "dark";
  const cardColors = {
    background: isDark ? "#111214" : "#ffffff",
    border: isDark ? "#27272a" : "#E5E7EB",
    text: isDark ? "#f4f4f5" : "#111827",
    muted: isDark ? "#a1a1aa" : "#6B7280",
    soft: isDark ? "#18181b" : "#F9FAFB",
    icon: isDark ? "#a1a1aa" : "#9CA3AF",
  };
  const copyButtonStyle = {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    backgroundColor: cardColors.soft,
    borderWidth: 1,
    borderColor: cardColors.border,
  };
  const copyText = async (label: string, value?: string) => {
    const safeValue = (value ?? "").trim();
    if (!safeValue) {
      Alert.alert("Copy Failed", `No ${label.toLowerCase()} available.`);
      return;
    }
    await Clipboard.setStringAsync(safeValue);
    Toast.show({
      type: "success",
      text1: "Copied",
      text2: `${label} copied`,
      position: "top",
      visibilityTime: 1600,
    });
  };
  const dropdownRowStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    backgroundColor: cardColors.soft,
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: cardColors.border,
  };
  const dropdownLabelStyle = {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  };
  const dropdownTextStyle = {
    fontSize: 12,
    color: cardColors.muted,
    fontWeight: "500" as const,
  };

  const handleCall = () => {
    const phone = item.customerPhone || (item as any).phone;
    if (!phone) return;
    const digits = String(phone).replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${digits}`).catch(() => {
      Alert.alert("Call Failed", "Could not open the dialer.");
    });
  };

  const customerName = item.customerName || "Unknown";
  const customerPhone = item.customerPhone || (item as any).phone || "";
  const customerAddress = (item as any).deliveryAddress || "";

  const formatDate = (value?: string) => {
    if (!value) return "N/A";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return "N/A";
    return d.toLocaleString("en-BD", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const generateInvoiceHtml = () => {
    const origin =
      typeof window !== "undefined" ? window.location.origin : "";
    const customerPhone = item.customerPhone || (item as any).phone || "N/A";
    const branding = {
      companyName:
        process.env.EXPO_PUBLIC_COMPANY_NAME || "Sleep Sheet",
      logoUrl:
        process.env.EXPO_PUBLIC_COMPANY_LOGO_URL ||
        (origin ? `${origin}/logo.png` : ""),
      address:
        process.env.EXPO_PUBLIC_COMPANY_ADDRESS ||
        "Dhaka, Bangladesh",
      phone:
        process.env.EXPO_PUBLIC_COMPANY_PHONE || customerPhone || "N/A",
      email:
        process.env.EXPO_PUBLIC_COMPANY_EMAIL || "support@sleepsheet.com",
      website:
        process.env.EXPO_PUBLIC_COMPANY_WEBSITE || origin || "",
    };

    const orderNo = (item as any).orderNumber || item._id;
    const issueDate = formatDate(new Date().toISOString());
    const orderDate = formatDate((item as any).orderDate);
    const address = (item as any).deliveryAddress || "N/A";
    const paymentStatus = ((item as any).paymentStatus || "pending")
      .toString()
      .replaceAll("_", " ");
    const isInsideDhaka = (item as any).isInsideDhaka;

    const formatInvoiceMoney = (amount: number) =>
      `BDT ${Number(amount || 0).toLocaleString("en-BD", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;

    const lineItems = products.map((line: any) => {
      const product = line?.product || line;
      const qty = Number(line?.quantity || 1);
      const unit = Number(product?.salePrice ?? product?.price ?? 0);
      const total = unit * qty;
      return {
        name: product?.name || "Unnamed Product",
        qty,
        unit,
        total,
      };
    });
    const subtotal = lineItems.reduce((sum, row) => sum + row.total, 0);
    const grandTotal = Number(item.totalPrice || 0);
    const shipping = Math.max(grandTotal - subtotal, 0);
    const statusColor =
      paymentStatus === "received"
        ? "#15803D"
        : paymentStatus === "pending"
        ? "#B45309"
        : "#0F766E";

    const rows = lineItems
      .map((row, index) => {
        return `
          <tr>
            <td>${index + 1}</td>
            <td>${row.name}</td>
            <td style="text-align:right">${formatInvoiceMoney(row.unit)}</td>
            <td style="text-align:center">${row.qty}</td>
            <td style="text-align:right">${formatInvoiceMoney(row.total)}</td>
          </tr>
        `;
      })
      .join("");

    return `
      <!doctype html>
      <html>
      <head>
        <meta charset="utf-8" />
        <meta name="color-scheme" content="only light" />
        <meta name="supported-color-schemes" content="light" />
        <title>Invoice ${orderNo}</title>
        <style>
          @page { background: #ffffff; margin: 0; }
          html, body { background: #ffffff !important; color: #111827 !important; }
          * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          * { box-sizing: border-box; }
          body { font-family: Arial, sans-serif; padding: 24px; color: #111827; background:#fff; }
          .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:1px solid #E5E7EB; padding-bottom:14px; margin-bottom:16px; }
          .title { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: 0.5px; }
          .brand-wrap { display:flex; align-items:flex-start; gap:12px; }
          .brand { font-size: 14px; font-weight:700; margin-bottom:2px; }
          .meta { color:#4B5563; font-size:12px; margin-top:2px; }
          .status-badge { margin-top:8px; display:inline-block; padding:6px 10px; border-radius:12px; color:#fff; font-size:11px; font-weight:700; background:${statusColor}; }
          .grid { display:grid; grid-template-columns: 1fr 1fr; gap:12px; margin-bottom:14px; }
          .card { border:1px solid #e5e7eb; border-radius: 8px; padding: 12px; background:#fff; }
          .card-title { font-size:11px; color:#6B7280; margin-bottom:8px; text-transform: uppercase; letter-spacing:0.4px; }
          .row { display:flex; justify-content:space-between; gap:12px; margin-bottom:6px; font-size:13px; }
          .row .label { color:#6B7280; min-width:36%; }
          .row .value { text-align:right; }
          table { width:100%; border-collapse: collapse; }
          th, td { border:1px solid #e5e7eb; padding:8px; font-size: 12px; }
          th { background:#111827; color:#fff; text-align:left; font-size:11px; letter-spacing:0.4px; text-transform:uppercase; }
          .summary { width: 44%; margin-left:auto; border:1px solid #E5E7EB; border-radius:8px; padding:10px; background:#F9FAFB; margin-top:12px; }
          .sum-row { display:flex; justify-content:space-between; margin-bottom:6px; font-size:12px; }
          .sum-label { color:#6B7280; }
          .sum-value { color:#111827; font-weight:700; }
          .grand { border-top:1px solid #E5E7EB; margin-top:8px; padding-top:8px; font-weight:700; font-size:14px; color:#0F766E; display:flex; justify-content:space-between; }
          .notes { margin-top:16px; border-top:1px solid #E5E7EB; padding-top:8px; color:#6B7280; font-size:11px; line-height:1.45; }
          .muted { color:#6b7280; font-size: 12px; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand-wrap">
            <div>
              <h1 class="title">INVOICE</h1>
              <div class="brand">${branding.companyName}</div>
              <div class="meta">${branding.address}</div>
              <div class="meta">Phone: ${branding.phone}</div>
              <div class="meta">Email: ${branding.email}</div>
              ${branding.website ? `<div class="meta">${branding.website}</div>` : ""}
            </div>
          </div>
          <div style="text-align:right">
            <div><strong>Invoice No:</strong> ${orderNo}</div>
            <div><strong>Issue Date:</strong> ${issueDate}</div>
            <div><strong>Order Date:</strong> ${orderDate}</div>
            <div class="status-badge">${paymentStatus.toUpperCase()}</div>
          </div>
        </div>

        <div class="grid">
          <div class="card">
            <div class="card-title">Bill To</div>
            <div class="row"><span class="label">Customer</span><span class="value">${item.customerName || "N/A"}</span></div>
            <div class="row"><span class="label">Phone</span><span class="value">${customerPhone}</span></div>
            <div class="row"><span class="label">Address</span><span class="value">${address}</span></div>
          </div>
          <div class="card">
            <div class="card-title">Delivery</div>
            <div class="row"><span class="label">Area</span><span class="value">${
              isInsideDhaka === undefined
                ? "N/A"
                : isInsideDhaka
                ? "Inside Dhaka"
                : "Outside Dhaka"
            }</span></div>
            <div class="row"><span class="label">Payment</span><span class="value">Cash on Delivery</span></div>
            <div class="row"><span class="label">Order Status</span><span class="value">${(
              item.status || "pending"
            ).toString()}</span></div>
          </div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width:40px">#</th>
              <th>Item</th>
              <th style="width:140px; text-align:right">Unit</th>
              <th style="width:80px; text-align:center">Qty</th>
              <th style="width:160px; text-align:right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${rows || `<tr><td colspan="5" style="text-align:center">No products</td></tr>`}
          </tbody>
        </table>

        <div class="summary">
          <div class="sum-row"><span class="sum-label">Subtotal</span><span class="sum-value">${formatInvoiceMoney(
            subtotal
          )}</span></div>
          <div class="sum-row"><span class="sum-label">Shipping</span><span class="sum-value">${formatInvoiceMoney(
            shipping
          )}</span></div>
          <div class="grand"><span>Grand Total</span><span>${formatInvoiceMoney(
            grandTotal
          )}</span></div>
        </div>

        <div class="notes">
          <div>Thanks for your purchase. For support contact ${branding.phone} / ${branding.email}.</div>
          <div>Generated from Sanity order data.</div>
        </div>
      </body>
      </html>
    `;
  };

  const handleDownloadInvoice = async () => {
    try {
      setDownloadingInvoice(true);
      const html = generateInvoiceHtml();
      const orderNo = (item as any).orderNumber || item._id;

      if (Platform.OS !== "web") {
        const printed = await Print.printToFileAsync({ html });
        const canShare = await Sharing.isAvailableAsync().catch(() => false);

        if (canShare) {
          await Sharing.shareAsync(printed.uri, {
            mimeType: "application/pdf",
          });
        } else if (Platform.OS === "android") {
          const contentUri = await FileSystem.getContentUriAsync(printed.uri);
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.VIEW,
            {
              data: contentUri,
              flags: 1,
              type: "application/pdf",
            }
          );
        } else {
          await Linking.openURL(printed.uri);
        }

        Toast.show({
          type: "success",
          text1: "PDF Ready",
          text2: `Invoice ${orderNo} generated`,
          position: "top",
          visibilityTime: 2200,
        });

        return;
      }

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        Alert.alert("Invoice Error", "Pop-up blocked. Please allow pop-ups.");
        return;
      }
      printWindow.document.open();
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
      }, 300);

      Toast.show({
        type: "success",
        text1: "Invoice Ready",
        text2: `Invoice ${orderNo}`,
        position: "top",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error("Invoice download failed:", error);
      Alert.alert("Invoice Error", "Failed to download invoice.");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  return (
    <View
      style={{
        backgroundColor: cardColors.background,
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
        borderWidth: 1,
        borderColor: cardColors.border,
      }}
    >
      {/* Header */}
      <View style={{ marginBottom: 12, gap: 6 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text
            style={{
              fontSize: 18,
              fontWeight: "700",
              color: cardColors.text,
              marginBottom: 4,
              flex: 1,
            }}
          >
            {customerName}
          </Text>
          <Pressable
            onPress={() => copyText("Name", customerName)}
            style={copyButtonStyle}
          >
            <Feather name="copy" size={13} color={cardColors.text} />
          </Pressable>
          {(item.customerPhone || (item as any).phone) ? (
            <Pressable
              onPress={handleCall}
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: cardColors.soft,
                borderWidth: 1,
                borderColor: cardColors.border,
              }}
            >
              <Feather name="phone-call" size={14} color={cardColors.text} />
            </Pressable>
          ) : null}
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 13, color: cardColors.muted, flex: 1 }}>
            {customerPhone || "No phone"}
          </Text>
          <Pressable
            onPress={() => copyText("Phone", customerPhone)}
            style={copyButtonStyle}
          >
            <Feather name="copy" size={13} color={cardColors.text} />
          </Pressable>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Text style={{ fontSize: 13, color: cardColors.muted, flex: 1 }}>
            {customerAddress || "No address"}
          </Text>
          <Pressable
            onPress={() => copyText("Address", customerAddress)}
            style={copyButtonStyle}
          >
            <Feather name="copy" size={13} color={cardColors.text} />
          </Pressable>
        </View>
      </View>

      {/* Product List */}
      <View style={{ marginBottom: 12, gap: 8 }}>
        {products.length > 0 ? (
          products.map((line: any, index: number) => {
            const product = line?.product || line;
            const image = product?.image;
            const name = product?.name || "Unnamed Product";
            const qty = line?.quantity || 1;

            return (
              <View
                key={`${item._id}-product-${index}`}
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 12,
                }}
              >
                <View
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                    backgroundColor: cardColors.soft,
                    overflow: "hidden",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {image ? (
                    <Image
                      source={{ uri: image }}
                      style={{ width: 60, height: 60 }}
                      contentFit="cover"
                    />
                  ) : (
                    <Feather name="image" size={16} color={cardColors.icon} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={{
                      fontSize: 14,
                      fontWeight: "600",
                      color: cardColors.text,
                    }}
                    numberOfLines={1}
                  >
                    {name}
                  </Text>
                  <Text style={{ fontSize: 12, color: cardColors.muted }}>
                    {qty} pcs
                  </Text>
                </View>
              </View>
            );
          })
        ) : (
          <Text style={{ fontSize: 12, color: cardColors.muted }}>No products</Text>
        )}
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
          ৳ {item.totalPrice?.toLocaleString("bn-BD")}
        </Text>
      </View>

      {showInvoiceActions ? (
        <TouchableOpacity
          onPress={handleDownloadInvoice}
          disabled={downloadingInvoice}
          style={{
            marginBottom: 12,
            backgroundColor: cardColors.soft,
            padding: 10,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: cardColors.border,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            opacity: downloadingInvoice ? 0.6 : 1,
          }}
        >
          <Feather name="download" size={14} color={cardColors.text} />
          <Text style={{ color: cardColors.text, fontSize: 13, fontWeight: "600" }}>
            {downloadingInvoice ? "Downloading..." : "Download Invoice"}
          </Text>
        </TouchableOpacity>
      ) : null}

      {/* Status Badges with Dropdowns */}
      <View style={{ gap: 8, marginBottom: 16 }}>
        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-status`)}
          style={dropdownRowStyle}
        >
          <View style={dropdownLabelStyle}>
            <Text style={dropdownTextStyle}>Order</Text>
            <StatusBadge status={item.status} type="order" />
          </View>
          <Feather name="chevron-down" size={16} color={cardColors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-paymentStatus`)}
          style={dropdownRowStyle}
        >
          <View style={dropdownLabelStyle}>
            <Text style={dropdownTextStyle}>Payment</Text>
            <StatusBadge status={item.paymentStatus} type="payment" />
          </View>
          <Feather name="chevron-down" size={16} color={cardColors.icon} />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setStatusDropdown(`${item._id}-deliveryStatus`)}
          style={dropdownRowStyle}
        >
          <View style={dropdownLabelStyle}>
            <Text style={dropdownTextStyle}>Delivery</Text>
            <StatusBadge status={item.deliveryStatus} type="delivery" />
          </View>
          <Feather name="chevron-down" size={16} color={cardColors.icon} />
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

// styles handled inline for theme responsiveness
