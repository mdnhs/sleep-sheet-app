import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import * as Linking from "expo-linking";
import Toast from "react-native-toast-message";
import { useLocalSearchParams, useRouter } from "expo-router";

import { createAdminOrder } from "@/api/adminOrders";
import {
  createAdminProduct,
  deleteAdminProduct,
  updateAdminProduct,
} from "@/api/adminProducts";
import { updateOrder } from "@/api/updateOrder";
import { FilterModal } from "@/components/FilterModal";
import { OrderCard } from "@/components/OrderCard";
import { useCatalogData } from "@/hooks/useCatalogData";
import { useOrders } from "@/hooks/useOrders";
import { useThemePreference } from "@/context/theme-preference";
import { CatalogCategory, CatalogProduct } from "@/types/catalog";
import { Filters } from "@/types/order";

import {
  AdminCard,
  AdminShell,
  AdminStatCard,
  COLORS,
  formatCurrency,
  useAdminColors,
} from "./adminShell";

type Order = {
  _id: string;
  customerName?: string;
  status?: string;
  totalPrice?: number;
  paymentStatus?: string;
  products?: { quantity?: number; product?: { name?: string } }[];
};

function OrderRow({
  order,
  onPress,
}: {
  order: Order;
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: COLORS.line,
          paddingVertical: 10,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 10 }}>
        <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 14 }}>
          {order.customerName || "Unknown customer"}
        </Text>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
          #{order._id.slice(0, 8)} · {order.status || "unknown"}
        </Text>
      </View>
      <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 13 }}>
        {formatCurrency(order.totalPrice ?? 0)}
      </Text>
    </Pressable>
  );
}

function LoadingState() {
  return (
    <View style={{ paddingVertical: 30, alignItems: "center", justifyContent: "center" }}>
      <ActivityIndicator size="large" color={COLORS.rose} />
      <Text style={{ marginTop: 8, color: COLORS.muted }}>Loading...</Text>
    </View>
  );
}

function ProductImage({ uri }: { uri?: string }) {
  if (!uri) {
    return (
      <View
        style={{
          width: 64,
          height: 64,
          borderRadius: 10,
          backgroundColor: COLORS.soft,
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Feather name="image" size={18} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={{ width: 64, height: 64, borderRadius: 10, backgroundColor: COLORS.soft }}
      contentFit="cover"
    />
  );
}

type CategoryTreeNode = CatalogCategory & { children: CategoryTreeNode[] };

function buildCategoryTree(categories: CatalogCategory[]) {
  const map = new Map<string, CategoryTreeNode>();
  const roots: CategoryTreeNode[] = [];

  categories.forEach((category) => {
    map.set(category._id, { ...category, children: [] });
  });

  map.forEach((node) => {
    const parentId = node.parent?._ref;
    if (parentId && map.has(parentId)) {
      map.get(parentId)?.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: CategoryTreeNode[]) => {
    nodes.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  return roots;
}

function buildCategoryPathMap(categories: CatalogCategory[]) {
  const byId = new Map(categories.map((category) => [category._id, category]));
  const cache = new Map<string, string>();

  const resolvePath = (id: string): string => {
    if (cache.has(id)) return cache.get(id) || "";
    const node = byId.get(id);
    if (!node) return "";

    const parentId = node.parent?._ref;
    const path = parentId && byId.has(parentId)
      ? `${resolvePath(parentId)} -> ${node.title}`
      : node.title;

    cache.set(id, path);
    return path;
  };

  categories.forEach((category) => resolvePath(category._id));
  return cache;
}

export function DashboardPage() {
  const router = useRouter();
  const { orders, loading } = useOrders({
    status: "all",
    deliveryStatus: "all",
    paymentStatus: "all",
  });
  const typedOrders = orders as Order[];

  const totalOrders = typedOrders.length;
  const totalSales = typedOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);
  const pending = typedOrders.filter((o) => o.status === "pending").length;
  const delivered = typedOrders.filter((o) => o.status === "delivered").length;

  return (
    <AdminShell
      title="Dashboard"
      subtitle="Admin control panel"
      activeRoute="/dashboard"
    >
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <AdminStatCard label="Total Orders" value={`${totalOrders}`} icon="shopping-bag" />
            <AdminStatCard label="Total Sales" value={formatCurrency(totalSales)} icon="dollar-sign" />
            <AdminStatCard label="Pending" value={`${pending}`} icon="clock" />
            <AdminStatCard label="Delivered" value={`${delivered}`} icon="check-circle" />
          </View>

          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <View style={{ flexGrow: 2, minWidth: 320 }}>
              <AdminCard title="Recent Activity">
                {typedOrders.slice(0, 8).map((order) => (
                  <OrderRow
                    key={order._id}
                    order={order}
                    onPress={() =>
                      router.push({
                        pathname: "/orders",
                        params: { orderId: order._id },
                      } as never)
                    }
                  />
                ))}
              </AdminCard>
            </View>
            <View style={{ flexGrow: 1, minWidth: 240 }}>
              <AdminCard title="Quick Summary">
                <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 8 }}>
                  Average order value
                </Text>
                <Text style={{ color: COLORS.text, fontWeight: "700", fontSize: 24 }}>
                  {formatCurrency(totalOrders > 0 ? totalSales / totalOrders : 0)}
                </Text>
              </AdminCard>
            </View>
          </View>
        </>
      )}
    </AdminShell>
  );
}

export function OrdersPage({
  title,
  route,
  status,
}: {
  title: string;
  route: string;
  status: string;
}) {
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();
  const [filters, setFilters] = useState<Filters>({
    status,
    deliveryStatus: "all",
    paymentStatus: "all",
  });
  const [filterModalVisible, setFilterModalVisible] = useState(false);
  const [statusDropdown, setStatusDropdown] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const { orders, loading, refetch } = useOrders(filters);
  const typedOrders = orders as Order[];
  const selectedOrderId = typeof orderId === "string" ? orderId : undefined;
  const visibleOrders = useMemo(() => {
    if (!selectedOrderId) return typedOrders;
    return typedOrders.filter((order) => order._id === selectedOrderId);
  }, [typedOrders, selectedOrderId]);
  const totalVisibleOrders = visibleOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalVisibleOrders / pageSize));
  const pagedOrders = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleOrders.slice(start, start + pageSize);
  }, [visibleOrders, currentPage]);

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
      status,
      deliveryStatus: "all",
      paymentStatus: "all",
    });
    setFilterModalVisible(false);
  };

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filters.status, filters.deliveryStatus, filters.paymentStatus]);

  React.useEffect(() => {
    if (selectedOrderId) {
      setCurrentPage(1);
    }
  }, [selectedOrderId]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  return (
    <AdminShell title={title} subtitle="Orders management" activeRoute={route}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 8,
        }}
      >
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          {totalVisibleOrders} orders · Page {currentPage} of {totalPages}
        </Text>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            gap: 6,
            backgroundColor: COLORS.rose,
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 10,
          }}
        >
          <Feather name="filter" size={14} color="#fff" />
          <Text style={{ color: "#fff", fontSize: 13, fontWeight: "600" }}>
            Filters
          </Text>
        </Pressable>
      </View>

      <AdminCard title={title}>
        {selectedOrderId ? (
          <View
            style={{
              backgroundColor: COLORS.soft,
              borderWidth: 1,
              borderColor: COLORS.line,
              borderRadius: 10,
              padding: 10,
              marginBottom: 10,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "600" }}>
              Showing selected order: #{selectedOrderId.slice(0, 8)}
            </Text>
          </View>
        ) : null}
        {loading ? (
          <LoadingState />
        ) : pagedOrders.length > 0 ? (
          pagedOrders.map((order) => (
            <OrderCard
              key={order._id}
              item={order as any}
              statusDropdown={statusDropdown}
              setStatusDropdown={setStatusDropdown}
              onStatusUpdate={handleStatusUpdate}
              showInvoiceActions
            />
          ))
        ) : (
          <Text style={{ color: COLORS.muted }}>No orders found.</Text>
        )}
      </AdminCard>

      {totalVisibleOrders > pageSize ? (
        <View style={{ flexDirection: "row", justifyContent: "flex-end", gap: 8 }}>
          <Pressable
            onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.line,
              backgroundColor: COLORS.panelBg,
              opacity: currentPage === 1 ? 0.5 : 1,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 12 }}>Prev</Text>
          </Pressable>
          <Pressable
            onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              borderRadius: 10,
              borderWidth: 1,
              borderColor: COLORS.line,
              backgroundColor: COLORS.panelBg,
              opacity: currentPage === totalPages ? 0.5 : 1,
            }}
          >
            <Text style={{ color: COLORS.text, fontSize: 12 }}>Next</Text>
          </Pressable>
        </View>
      ) : null}

      <FilterModal
        visible={filterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        filters={filters}
        setFilters={setFilters}
        onReset={resetFilters}
      />
    </AdminShell>
  );
}

export function ReportsPage() {
  const { orders, loading } = useOrders({
    status: "all",
    deliveryStatus: "all",
    paymentStatus: "all",
  });
  const typedOrders = orders as Order[];

  const total = typedOrders.length;
  const delivered = typedOrders.filter((o) => o.status === "delivered");
  const deliveredSales = delivered.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);
  const totalSales = typedOrders.reduce((sum, o) => sum + (o.totalPrice ?? 0), 0);

  return (
    <AdminShell title="Reports" subtitle="Sales and operational insights" activeRoute="/reports">
      {loading ? (
        <LoadingState />
      ) : (
        <>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 12 }}>
            <AdminStatCard label="Gross Sales" value={formatCurrency(totalSales)} icon="trending-up" />
            <AdminStatCard label="Delivered Sales" value={formatCurrency(deliveredSales)} icon="check" />
            <AdminStatCard label="Conversion" value={`${total ? Math.round((delivered.length / total) * 100) : 0}%`} icon="pie-chart" />
          </View>
          <AdminCard title="Revenue Snapshot">
            <Text style={{ color: COLORS.text, fontSize: 14 }}>
              Delivered orders: {delivered.length}
            </Text>
            <Text style={{ color: COLORS.muted, fontSize: 13, marginTop: 4 }}>
              Total orders: {total}
            </Text>
          </AdminCard>
        </>
      )}
    </AdminShell>
  );
}

export function ProductsPage() {
  const colors = useAdminColors();
  const { products, categories, loading, refetch } = useCatalogData();
  const [search, setSearch] = useState("");
  const [categoryId, setCategoryId] = useState("all");
  const [isCreateAccordionOpen, setIsCreateAccordionOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{
    name: string;
    slug: string;
    description: string;
    imageUri: string;
    galleryUris: string;
    variantsText: string;
    price: string;
    salePrice: string;
    stock: string;
    isHot: boolean;
    categoryIds: string[];
  }>({
    name: "",
    slug: "",
    description: "",
    imageUri: "",
    galleryUris: "",
    variantsText: "[]",
    price: "",
    salePrice: "",
    stock: "",
    isHot: false,
    categoryIds: [],
  });

  const buildSlug = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-");

  const resetForm = () => {
    setEditingId(null);
    setIsCreateAccordionOpen(false);
    setForm({
      name: "",
      slug: "",
      description: "",
      imageUri: "",
      galleryUris: "",
      variantsText: "[]",
      price: "",
      salePrice: "",
      stock: "",
      isHot: false,
      categoryIds: [],
    });
  };

  const descriptionToPlainText = (description: any) => {
    if (!Array.isArray(description)) return "";
    return description
      .map((block: any) =>
        Array.isArray(block?.children)
          ? block.children.map((child: any) => child?.text || "").join("")
          : ""
      )
      .filter(Boolean)
      .join("\n");
  };

  const variantsToEditorText = (variants: CatalogProduct["variants"] = []) => {
    return JSON.stringify(
      variants.map((variant) => ({
        name: variant.name || "",
        imageUri: variant.imageUrl || "",
        price: variant.price,
        salePrice: variant.salePrice,
      })),
      null,
      2
    );
  };

  const startEdit = (product: CatalogProduct) => {
    setIsCreateAccordionOpen(true);
    setEditingId(product._id);
    setForm({
      name: product.name ?? "",
      slug: product.slug?.current ?? buildSlug(product.name ?? ""),
      description: descriptionToPlainText(product.description),
      imageUri: product.imageUrl ?? "",
      galleryUris: (product.galleryUrls ?? []).join("\n"),
      variantsText: variantsToEditorText(product.variants ?? []),
      price: String(product.price ?? 0),
      salePrice:
        typeof product.salePrice === "number" ? String(product.salePrice) : "",
      stock: String(product.stock ?? 0),
      isHot: Boolean(product.isHot),
      categoryIds: (product.categories ?? []).map((c) => c._id),
    });
  };

  const toggleCategory = (id: string) => {
    setForm((prev) => ({
      ...prev,
      categoryIds: prev.categoryIds.includes(id)
        ? prev.categoryIds.filter((x) => x !== id)
        : [...prev.categoryIds, id],
    }));
  };

  const saveProduct = async () => {
    const trimmedName = form.name.trim();
    const trimmedSlug = (form.slug || buildSlug(trimmedName)).trim();
    const priceNum = Number(form.price);
    const stockNum = Number(form.stock);
    const salePriceNum = form.salePrice.trim() === "" ? undefined : Number(form.salePrice);

    if (!trimmedName) {
      Alert.alert("Validation", "Product name is required.");
      return;
    }
    if (!trimmedSlug) {
      Alert.alert("Validation", "Slug is required.");
      return;
    }
    if (!Number.isFinite(priceNum) || priceNum < 0) {
      Alert.alert("Validation", "Price must be a valid number.");
      return;
    }
    if (!Number.isFinite(stockNum) || stockNum < 0) {
      Alert.alert("Validation", "Stock must be a valid number.");
      return;
    }
    if (salePriceNum !== undefined && (!Number.isFinite(salePriceNum) || salePriceNum < 0 || salePriceNum > priceNum)) {
      Alert.alert("Validation", "Sale price must be between 0 and price.");
      return;
    }
    if (form.categoryIds.length === 0) {
      Alert.alert("Validation", "Select at least one category.");
      return;
    }

    let variants: {
      name: string;
      imageUri?: string;
      price?: number;
      salePrice?: number;
    }[] = [];
    try {
      const parsed = JSON.parse(form.variantsText || "[]");
      if (!Array.isArray(parsed)) throw new Error("Variants must be an array.");
      variants = parsed
        .map((item: any) => ({
          name: String(item?.name ?? "").trim(),
          imageUri: String(item?.imageUri ?? "").trim() || undefined,
          price:
            item?.price === undefined || item?.price === null || item?.price === ""
              ? undefined
              : Number(item.price),
          salePrice:
            item?.salePrice === undefined ||
            item?.salePrice === null ||
            item?.salePrice === ""
              ? undefined
              : Number(item.salePrice),
        }))
        .filter((item) => item.name.length > 0);
    } catch {
      Alert.alert("Validation", "Variants must be valid JSON array.");
      return;
    }

    const galleryUris = form.galleryUris
      .split(/\n|,/)
      .map((uri) => uri.trim())
      .filter(Boolean);

    setSaving(true);
    const payload = {
      name: trimmedName,
      slug: trimmedSlug,
      descriptionText: form.description,
      imageUri: form.imageUri.trim() || undefined,
      galleryUris,
      price: priceNum,
      salePrice: salePriceNum,
      stock: stockNum,
      isHot: form.isHot,
      categoryIds: form.categoryIds,
      variants,
    };
    const result = editingId
      ? await updateAdminProduct(editingId, payload)
      : await createAdminProduct(payload);
    setSaving(false);

    if (!result.success) {
      Alert.alert("Error", result.error || "Could not save product.");
      return;
    }

    await refetch();
    resetForm();
  };

  const removeProduct = (product: CatalogProduct) => {
    Alert.alert(
      "Delete Product",
      `Delete "${product.name}" permanently?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            const result = await deleteAdminProduct(product._id);
            if (!result.success) {
              Alert.alert("Error", result.error || "Delete failed.");
              return;
            }
            await refetch();
          },
        },
      ]
    );
  };

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const searchMatch = !query || product.name?.toLowerCase().includes(query);
      const categoryMatch =
        categoryId === "all" ||
        (product.categories ?? []).some((category) => category._id === categoryId);
      return searchMatch && categoryMatch;
    });
  }, [products, search, categoryId]);
  const categoryPathMap = useMemo(() => buildCategoryPathMap(categories), [categories]);

  return (
    <AdminShell title="Products" subtitle="Catalog and stock overview" activeRoute="/products">
      <AdminCard title="Create Product">
        <Pressable
          onPress={() => setIsCreateAccordionOpen((prev) => !prev)}
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            backgroundColor: "#F9FAFB",
            borderWidth: 1,
            borderColor: COLORS.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
          }}
        >
          <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 14 }}>
            {editingId ? "Edit Product" : "Open Create Product"}
          </Text>
          <Feather
            name={isCreateAccordionOpen ? "chevron-up" : "chevron-down"}
            size={16}
            color={COLORS.muted}
          />
        </Pressable>

        {isCreateAccordionOpen ? (
          <View style={{ gap: 10, marginTop: 10 }}>
            <TextInput
              placeholder="Product name"
              value={form.name}
              onChangeText={(value) =>
                setForm((prev) => ({
                  ...prev,
                  name: value,
                  slug: prev.slug ? prev.slug : buildSlug(value),
                }))
              }
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: COLORS.text,
              }}
            />
            <TextInput
              placeholder="Description"
              value={form.description}
              onChangeText={(value) => setForm((prev) => ({ ...prev, description: value }))}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 92,
                color: COLORS.text,
              }}
            />
            <TextInput
              placeholder="Featured image URL"
              value={form.imageUri}
              onChangeText={(value) => setForm((prev) => ({ ...prev, imageUri: value }))}
              autoCapitalize="none"
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: COLORS.text,
              }}
            />
            <TextInput
              placeholder="Gallery image URLs (comma or newline separated)"
              value={form.galleryUris}
              onChangeText={(value) => setForm((prev) => ({ ...prev, galleryUris: value }))}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 82,
                color: COLORS.text,
              }}
            />
            <TextInput
              placeholder='Variants JSON: [{"name":"Red/L","imageUri":"https://...","price":500,"salePrice":450}]'
              value={form.variantsText}
              onChangeText={(value) => setForm((prev) => ({ ...prev, variantsText: value }))}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                minHeight: 130,
                color: COLORS.text,
                fontFamily: "monospace",
              }}
            />
            <TextInput
              placeholder="Slug"
              value={form.slug}
              onChangeText={(value) => setForm((prev) => ({ ...prev, slug: value }))}
              style={{
                borderWidth: 1,
                borderColor: COLORS.line,
                borderRadius: 10,
                paddingHorizontal: 12,
                paddingVertical: 10,
                color: COLORS.text,
              }}
            />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <TextInput
                placeholder="Price"
                value={form.price}
                onChangeText={(value) => setForm((prev) => ({ ...prev, price: value }))}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: COLORS.text,
                }}
              />
              <TextInput
                placeholder="Sale Price"
                value={form.salePrice}
                onChangeText={(value) => setForm((prev) => ({ ...prev, salePrice: value }))}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: COLORS.text,
                }}
              />
              <TextInput
                placeholder="Stock"
                value={form.stock}
                onChangeText={(value) => setForm((prev) => ({ ...prev, stock: value }))}
                keyboardType="numeric"
                style={{
                  flex: 1,
                  borderWidth: 1,
                  borderColor: COLORS.line,
                  borderRadius: 10,
                  paddingHorizontal: 12,
                  paddingVertical: 10,
                  color: COLORS.text,
                }}
              />
            </View>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 14 }}>Hot Product</Text>
              <Switch
                value={form.isHot}
                onValueChange={(value) => setForm((prev) => ({ ...prev, isHot: value }))}
                trackColor={{ false: "#D1D5DB", true: "#F9A8D4" }}
                thumbColor={form.isHot ? COLORS.rose : colors.panelBg}
              />
            </View>

            <View>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
                Categories (select one or more)
              </Text>
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
                {categories.map((category) => {
                  const selected = form.categoryIds.includes(category._id);
                  return (
                    <Pressable
                      key={category._id}
                      onPress={() => toggleCategory(category._id)}
                      style={{
                        paddingHorizontal: 10,
                        paddingVertical: 6,
                        borderRadius: 999,
                        borderWidth: 1,
                        borderColor: selected ? COLORS.rose : COLORS.line,
                        backgroundColor: selected ? colors.soft : colors.panelBg,
                      }}
                    >
                      <Text style={{ color: COLORS.text, fontSize: 12 }}>
                        {category.title}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={saveProduct}
                disabled={saving}
                style={{
                  backgroundColor: COLORS.rose,
                  paddingHorizontal: 14,
                  paddingVertical: 10,
                  borderRadius: 10,
                  opacity: saving ? 0.6 : 1,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "600", fontSize: 13 }}>
                  {saving ? "Saving..." : editingId ? "Update Product" : "Create Product"}
                </Text>
              </Pressable>
              {editingId ? (
                <Pressable
                  onPress={resetForm}
                  style={{
                    backgroundColor: colors.soft,
                    paddingHorizontal: 14,
                    paddingVertical: 10,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: COLORS.line,
                  }}
                >
                  <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 13 }}>
                    Cancel
                  </Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : (
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 10 }}>
            Tap to open create product form.
          </Text>
        )}
      </AdminCard>

      <AdminCard title="Product Filters">
        <TextInput
          placeholder="Search products..."
          value={search}
          onChangeText={setSearch}
          style={{
            borderWidth: 1,
            borderColor: COLORS.line,
            borderRadius: 10,
            paddingHorizontal: 12,
            paddingVertical: 10,
            marginBottom: 10,
            color: COLORS.text,
            backgroundColor: colors.panelBg,
          }}
        />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setCategoryId("all")}
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: categoryId === "all" ? COLORS.rose : COLORS.line,
                backgroundColor: categoryId === "all" ? colors.soft : colors.panelBg,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>All</Text>
            </Pressable>
            {categories.map((category) => (
              <Pressable
                key={category._id}
                onPress={() => setCategoryId(category._id)}
                style={{
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  borderRadius: 999,
                  borderWidth: 1,
                  borderColor: categoryId === category._id ? COLORS.rose : COLORS.line,
                  backgroundColor:
                    categoryId === category._id ? colors.soft : colors.panelBg,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 12 }}>
                  {categoryPathMap.get(category._id) || category.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>
      </AdminCard>

      <AdminCard title={`Products (${filteredProducts.length})`}>
        {loading ? (
          <LoadingState />
        ) : filteredProducts.length > 0 ? (
          filteredProducts.map((product: CatalogProduct) => (
            <View
              key={product._id}
              style={{
                flexDirection: "row",
                alignItems: "center",
                borderTopWidth: 1,
                borderTopColor: COLORS.line,
                paddingVertical: 10,
                gap: 10,
              }}
            >
              <ProductImage uri={product.imageUrl} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "600" }}>
                  {product.name}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                  {(product.categories ?? []).map((c) => c.title).join(", ") || "Uncategorized"}
                </Text>
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={{ color: COLORS.text, fontSize: 13, fontWeight: "700" }}>
                  {formatCurrency(product.salePrice ?? product.price ?? 0)}
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                  Stock: {product.stock ?? 0}
                </Text>
                <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                  <Pressable onPress={() => startEdit(product)}>
                    <Text style={{ color: "#2563EB", fontSize: 12, fontWeight: "600" }}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable onPress={() => removeProduct(product)}>
                    <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "600" }}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            </View>
          ))
        ) : (
          <Text style={{ color: COLORS.muted }}>No products found.</Text>
        )}
      </AdminCard>
    </AdminShell>
  );
}

export function CategoriesPage() {
  const { categories, loading } = useCatalogData();
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryMap = useMemo(
    () =>
      categories.reduce<Record<string, CatalogCategory>>((acc, category) => {
        acc[category._id] = category;
        return acc;
      }, {}),
    [categories]
  );

  return (
    <AdminShell title="Categories" subtitle="Manage storefront categories" activeRoute="/categories">
      <AdminCard title={`Categories (${categories.length})`}>
        {loading ? (
          <LoadingState />
        ) : categoryTree.length > 0 ? (
          <View>
            {categoryTree.map((node) => (
              <CategoryTreeRow
                key={node._id}
                node={node}
                depth={0}
                categoryMap={categoryMap}
              />
            ))}
          </View>
        ) : (
          <Text style={{ color: COLORS.muted }}>No categories found.</Text>
        )}
      </AdminCard>
    </AdminShell>
  );
}

function CategoryTreeRow({
  node,
  depth,
  categoryMap,
}: {
  node: CategoryTreeNode;
  depth: number;
  categoryMap: Record<string, CatalogCategory>;
}) {
  return (
    <View>
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          borderTopWidth: 1,
          borderTopColor: COLORS.line,
          paddingVertical: 10,
          gap: 10,
          paddingLeft: depth * 18,
        }}
      >
        <ProductImage uri={node.imageUrl || node.bannerImageUrl} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "600" }}>
            {node.title}
          </Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
            {depth === 0
              ? "Root"
              : `Parent: ${
                  node.parent?._ref
                    ? categoryMap[node.parent._ref]?.title || "Unknown"
                    : "Root"
                }`}
          </Text>
        </View>
      </View>
      {node.children.map((child) => (
        <CategoryTreeRow
          key={child._id}
          node={child}
          depth={depth + 1}
          categoryMap={categoryMap}
        />
      ))}
    </View>
  );
}

export function ShopPage() {
  const colors = useAdminColors();
  const { products, categories, loading } = useCatalogData();
  const { width } = useWindowDimensions();
  const showSidebar = width >= 1100;
  const shopInputStyle = React.useMemo(() => getShopInputStyle(colors), [colors]);
  const shopCheckoutInputStyle = React.useMemo(
    () => getShopCheckoutInputStyle(colors),
    [colors]
  );
  const defaultFilters = {
    search: "",
    categoryId: "all",
    minPrice: "",
    maxPrice: "",
    sortBy: "featured" as "featured" | "price_asc" | "price_desc" | "name_asc",
  };
  const [appliedFilters, setAppliedFilters] = useState(defaultFilters);
  const [draftFilters, setDraftFilters] = useState(defaultFilters);
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [cart, setCart] = useState<{ product: CatalogProduct; qty: number }[]>(
    []
  );
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submittingOrder, setSubmittingOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: "",
    phone: "",
    address: "",
    isInsideDhaka: true,
    notes: "",
    branch: "sleep_sheet",
  });

  const groupedCategories = useMemo(() => buildCategoryTree(categories), [categories]);
  const categoryPathMap = useMemo(() => buildCategoryPathMap(categories), [categories]);
  const descendantMap = useMemo(() => {
    const childrenByParent = new Map<string, string[]>();
    categories.forEach((category) => {
      const parentId = category.parent?._ref;
      if (!parentId) return;
      if (!childrenByParent.has(parentId)) childrenByParent.set(parentId, []);
      childrenByParent.get(parentId)?.push(category._id);
    });

    const collect = (id: string): string[] => {
      const children = childrenByParent.get(id) || [];
      const descendants = [id];
      children.forEach((child) => descendants.push(...collect(child)));
      return descendants;
    };

    const map = new Map<string, string[]>();
    categories.forEach((category) => map.set(category._id, collect(category._id)));
    return map;
  }, [categories]);

  const visibleProducts = useMemo(() => {
    const q = appliedFilters.search.trim().toLowerCase();
    const min = appliedFilters.minPrice.trim() ? Number(appliedFilters.minPrice) : null;
    const max = appliedFilters.maxPrice.trim() ? Number(appliedFilters.maxPrice) : null;
    const allowedIds =
      appliedFilters.categoryId === "all"
        ? null
        : new Set(
            descendantMap.get(appliedFilters.categoryId) || [
              appliedFilters.categoryId,
            ]
          );

    const filtered = products.filter((product) => {
      const price = product.salePrice ?? product.price ?? 0;
      const nameOk = !q || product.name?.toLowerCase().includes(q);
      const categoryOk =
        !allowedIds ||
        (product.categories ?? []).some((category) => allowedIds.has(category._id));
      const minOk = min === null || (!Number.isNaN(min) && price >= min);
      const maxOk = max === null || (!Number.isNaN(max) && price <= max);
      return nameOk && categoryOk && minOk && maxOk;
    });

    if (appliedFilters.sortBy === "price_asc") {
      filtered.sort(
        (a, b) => (a.salePrice ?? a.price ?? 0) - (b.salePrice ?? b.price ?? 0)
      );
    } else if (appliedFilters.sortBy === "price_desc") {
      filtered.sort(
        (a, b) => (b.salePrice ?? b.price ?? 0) - (a.salePrice ?? a.price ?? 0)
      );
    } else if (appliedFilters.sortBy === "name_asc") {
      filtered.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    } else {
      filtered.sort((a, b) => Number(Boolean(b.isHot)) - Number(Boolean(a.isHot)));
    }

    return filtered;
  }, [products, appliedFilters, descendantMap]);

  const pageSize = showSidebar ? 9 : 8;
  const totalPages = Math.max(1, Math.ceil(visibleProducts.length / pageSize));
  const pagedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return visibleProducts.slice(start, start + pageSize);
  }, [visibleProducts, currentPage, pageSize]);

  const cartTotal = useMemo(
    () =>
      cart.reduce(
        (sum, item) =>
          sum + (item.product.salePrice ?? item.product.price ?? 0) * item.qty,
        0
      ),
    [cart]
  );

  const addToCart = (product: CatalogProduct, qty = 1) => {
    setCart((prev) => {
      const idx = prev.findIndex((item) => item.product._id === product._id);
      if (idx === -1) return [...prev, { product, qty }];
      const next = [...prev];
      next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      return next;
    });
    Toast.show({
      type: "success",
      text1: "Added to Cart",
      text2: `${product.name} added successfully`,
      position: "top",
      visibilityTime: 1800,
    });
  };

  const setCartQty = (productId: string, qty: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.product._id === productId ? { ...item, qty } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const clearFilters = () => {
    setDraftFilters(defaultFilters);
    setAppliedFilters(defaultFilters);
    setCurrentPage(1);
  };

  const applyFilters = () => {
    setAppliedFilters(draftFilters);
    setCurrentPage(1);
    if (!showSidebar) {
      setFilterDrawerOpen(false);
    }
  };

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const placeOrder = async () => {
    if (cart.length === 0) {
      Alert.alert("Cart Empty", "Add at least one product.");
      return;
    }
    if (
      !orderForm.customerName.trim() ||
      !orderForm.phone.trim() ||
      !orderForm.address.trim()
    ) {
      Alert.alert("Required", "Customer name, phone and address are required.");
      return;
    }

    setSubmittingOrder(true);
    const result = await createAdminOrder({
      customerName: orderForm.customerName,
      phone: orderForm.phone,
      deliveryAddress: orderForm.address,
      isInsideDhaka: orderForm.isInsideDhaka,
      specialInstructions: orderForm.notes,
      branch: orderForm.branch,
      items: cart.map((item) => ({
        productId: item.product._id,
        quantity: item.qty,
        unitPrice: item.product.salePrice ?? item.product.price ?? 0,
      })),
    });
    setSubmittingOrder(false);

    if (!result.success) {
      Alert.alert("Order Failed", result.error || "Could not create order.");
      return;
    }

    Toast.show({
      type: "success",
      text1: "Order Created",
      text2: `Order No: ${result.order?.orderNumber}`,
      position: "top",
      visibilityTime: 2500,
    });
    Alert.alert("Order Created", `Order No: ${result.order?.orderNumber}`);
    setCheckoutOpen(false);
    setCart([]);
    setOrderForm({
      customerName: "",
      phone: "",
      address: "",
      isInsideDhaka: true,
      notes: "",
      branch: "sleep_sheet",
    });
  };

  const renderCategoryNode = (node: CategoryTreeNode, depth = 0): React.ReactNode => (
    <View key={node._id}>
      <Pressable
        onPress={() =>
          setDraftFilters((prev) => ({ ...prev, categoryId: node._id }))
        }
        style={{
          paddingVertical: 7,
          paddingLeft: depth * 14 + 8,
          borderRadius: 8,
          backgroundColor:
            draftFilters.categoryId === node._id ? colors.soft : "transparent",
          borderWidth: draftFilters.categoryId === node._id ? 1 : 0,
          borderColor:
            draftFilters.categoryId === node._id ? COLORS.rose : "transparent",
          marginBottom: 4,
        }}
      >
        <Text style={{ color: COLORS.text, fontSize: 13 }}>{node.title}</Text>
      </Pressable>
      {node.children.map((child) => renderCategoryNode(child, depth + 1))}
    </View>
  );

  const renderFiltersCard = () => (
    <AdminCard title="Filters">
      <TextInput
        placeholder="Search product..."
        value={draftFilters.search}
        onChangeText={(value) =>
          setDraftFilters((prev) => ({ ...prev, search: value }))
        }
        placeholderTextColor={COLORS.muted}
        style={{
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 10,
          paddingHorizontal: 12,
          paddingVertical: 10,
          color: COLORS.text,
          backgroundColor: colors.panelBg,
        }}
      />
      <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
        <TextInput
          placeholder="Min price"
          value={draftFilters.minPrice}
          onChangeText={(value) =>
            setDraftFilters((prev) => ({ ...prev, minPrice: value }))
          }
          keyboardType="numeric"
          placeholderTextColor={COLORS.muted}
          style={shopInputStyle}
        />
        <TextInput
          placeholder="Max price"
          value={draftFilters.maxPrice}
          onChangeText={(value) =>
            setDraftFilters((prev) => ({ ...prev, maxPrice: value }))
          }
          keyboardType="numeric"
          placeholderTextColor={COLORS.muted}
          style={shopInputStyle}
        />
      </View>

      <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 10, marginBottom: 8 }}>
        Sort By
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        {[
          { key: "featured", label: "Featured" },
          { key: "price_asc", label: "Price Low-High" },
          { key: "price_desc", label: "Price High-Low" },
          { key: "name_asc", label: "Name A-Z" },
        ].map((option) => {
          const selected = draftFilters.sortBy === option.key;
          return (
            <Pressable
              key={option.key}
              onPress={() =>
                setDraftFilters((prev) => ({
                  ...prev,
                  sortBy: option.key as
                    | "featured"
                    | "price_asc"
                    | "price_desc"
                    | "name_asc",
                }))
              }
              style={{
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 999,
                borderWidth: 1,
                borderColor: selected ? COLORS.rose : COLORS.line,
                backgroundColor: selected ? colors.soft : colors.panelBg,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>{option.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <View style={{ marginTop: 10 }}>
        <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 8 }}>
          Category
        </Text>
        <Pressable
          onPress={() =>
            setDraftFilters((prev) => ({ ...prev, categoryId: "all" }))
          }
          style={{
            paddingVertical: 8,
            paddingHorizontal: 8,
            borderRadius: 8,
            backgroundColor:
              draftFilters.categoryId === "all" ? colors.soft : "transparent",
            borderWidth: draftFilters.categoryId === "all" ? 1 : 0,
            borderColor:
              draftFilters.categoryId === "all" ? COLORS.rose : "transparent",
            marginBottom: 6,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 13 }}>All Categories</Text>
        </Pressable>
        <ScrollView style={{ maxHeight: 260 }} nestedScrollEnabled>
          {groupedCategories.map((node) => renderCategoryNode(node))}
        </ScrollView>
      </View>

      <Pressable
        onPress={clearFilters}
        style={{
          marginTop: 10,
          borderWidth: 1,
          borderColor: COLORS.line,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 13 }}>
          Clear Filters
        </Text>
      </Pressable>

      <Pressable
        onPress={applyFilters}
        style={{
          marginTop: 8,
          backgroundColor: COLORS.rose,
          borderRadius: 10,
          paddingVertical: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "#fff", fontWeight: "700", fontSize: 13 }}>
          Apply Filters
        </Text>
      </Pressable>
    </AdminCard>
  );

  return (
    <AdminShell title="Shop" subtitle="Store overview and quick actions" activeRoute="/shop">
      <View style={{ flexDirection: showSidebar ? "row" : "column", gap: 12 }}>
        {showSidebar ? (
          <View style={{ width: 280 }}>{renderFiltersCard()}</View>
        ) : null}

        <View style={{ flex: 1, minWidth: 0, gap: 12 }}>
          <AdminCard title="Shop Header">
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: 10,
              }}
            >
              <View>
                <Text style={{ color: COLORS.text, fontSize: 16, fontWeight: "700" }}>
                  Products ({visibleProducts.length}/{products.length})
                </Text>
                <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                  {appliedFilters.categoryId === "all"
                    ? "All Categories"
                    : categoryPathMap.get(appliedFilters.categoryId) ||
                      "Selected category"}
                </Text>
              </View>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {!showSidebar ? (
                  <Pressable
                    onPress={() => {
                      setDraftFilters(appliedFilters);
                      setFilterDrawerOpen(true);
                    }}
                    style={{
                      paddingHorizontal: 12,
                      paddingVertical: 8,
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: COLORS.line,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontSize: 12 }}>Filters</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => setCheckoutOpen(true)}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: 10,
                    backgroundColor: cart.length ? COLORS.rose : "#D1D5DB",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                    Order ({cart.length})
                  </Text>
                </Pressable>
              </View>
            </View>
          </AdminCard>

          <AdminCard title={`Catalog (${visibleProducts.length})`}>
            {loading ? (
              <LoadingState />
            ) : pagedProducts.length > 0 ? (
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10 }}>
                {pagedProducts.map((product) => (
                  <View
                    key={product._id}
                    style={{
                      width: showSidebar ? "32%" : "100%",
                      minWidth: showSidebar ? 240 : undefined,
                      borderWidth: 1,
                      borderColor: COLORS.line,
                      borderRadius: 12,
                      padding: 10,
                      backgroundColor: colors.panelBg,
                    }}
                  >
                    <ProductImage uri={product.imageUrl} />
                    <Text
                      numberOfLines={1}
                      style={{ color: COLORS.text, fontSize: 14, fontWeight: "700", marginTop: 8 }}
                    >
                      {product.name}
                    </Text>
                    <Text
                      numberOfLines={2}
                      style={{ color: COLORS.muted, fontSize: 12, marginTop: 2, minHeight: 32 }}
                    >
                      {(product.categories ?? []).map((c) => c.title).join(", ") ||
                        "Uncategorized"}
                    </Text>
                    {typeof product.salePrice === "number" &&
                    (product.price ?? 0) > product.salePrice ? (
                      <View style={{ marginTop: 6 }}>
                        <Text
                          style={{
                            color: "#9CA3AF",
                            fontSize: 12,
                            textDecorationLine: "line-through",
                          }}
                        >
                          {formatCurrency(product.price ?? 0)}
                        </Text>
                        <Text
                          style={{
                            color: "#DC2626",
                            fontWeight: "700",
                            fontSize: 14,
                            marginTop: 2,
                          }}
                        >
                          Offer: {formatCurrency(product.salePrice)}
                        </Text>
                      </View>
                    ) : (
                      <Text
                        style={{
                          color: COLORS.text,
                          fontWeight: "700",
                          fontSize: 14,
                          marginTop: 6,
                        }}
                      >
                        {formatCurrency(product.price ?? 0)}
                      </Text>
                    )}
                    <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                      <Pressable
                        onPress={() => addToCart(product)}
                        style={{
                          flex: 1,
                          backgroundColor: COLORS.rose,
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: "#fff", fontSize: 12, fontWeight: "700" }}>
                          Add to Cart
                        </Text>
                      </Pressable>
                      <Pressable
                        onPress={() => {
                          setCart([{ product, qty: 1 }]);
                          setCheckoutOpen(true);
                        }}
                        style={{
                          flex: 1,
                          borderWidth: 1,
                          borderColor: COLORS.line,
                          borderRadius: 8,
                          paddingVertical: 8,
                          alignItems: "center",
                        }}
                      >
                        <Text style={{ color: COLORS.text, fontSize: 12, fontWeight: "700" }}>
                          Order Now
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={{ color: COLORS.muted }}>No products match current filters.</Text>
            )}

            {!loading && visibleProducts.length > 0 ? (
              <View
                style={{
                  marginTop: 12,
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Text style={{ color: COLORS.muted, fontSize: 12 }}>
                  Page {currentPage} of {totalPages}
                </Text>
                <View style={{ flexDirection: "row", gap: 8 }}>
                  <Pressable
                    onPress={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.line,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      opacity: currentPage === 1 ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontSize: 12 }}>Prev</Text>
                  </Pressable>
                  <Pressable
                    onPress={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.line,
                      borderRadius: 8,
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      opacity: currentPage === totalPages ? 0.5 : 1,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontSize: 12 }}>Next</Text>
                  </Pressable>
                </View>
              </View>
            ) : null}
          </AdminCard>
        </View>
      </View>

      <Modal
        visible={filterDrawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setDraftFilters(appliedFilters);
          setFilterDrawerOpen(false);
        }}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.panelBg,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "82%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}>
                Filters
              </Text>
              <Pressable
                onPress={() => {
                  setDraftFilters(appliedFilters);
                  setFilterDrawerOpen(false);
                }}
              >
                <Feather name="x" size={20} color={COLORS.muted} />
              </Pressable>
            </View>
            <ScrollView showsVerticalScrollIndicator={false}>
              {renderFiltersCard()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={checkoutOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setCheckoutOpen(false)}
      >
        <View
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.45)",
            justifyContent: "flex-end",
          }}
        >
          <View
            style={{
              backgroundColor: colors.panelBg,
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              padding: 16,
              maxHeight: "88%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 18, fontWeight: "700" }}>
                Create Order
              </Text>
              <Pressable onPress={() => setCheckoutOpen(false)}>
                <Feather name="x" size={20} color={COLORS.muted} />
              </Pressable>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={{ color: COLORS.muted, fontSize: 12, marginBottom: 6 }}>
                Cart Items
              </Text>
              {cart.length === 0 ? (
                <Text style={{ color: COLORS.muted, fontSize: 13, marginBottom: 10 }}>
                  No products in cart.
                </Text>
              ) : (
                cart.map((item) => (
                  <View
                    key={item.product._id}
                    style={{
                      borderWidth: 1,
                      borderColor: COLORS.line,
                      borderRadius: 10,
                      padding: 10,
                      marginBottom: 8,
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontWeight: "600", fontSize: 14 }}>
                      {item.product.name}
                    </Text>
                    <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                      {formatCurrency(item.product.salePrice ?? item.product.price ?? 0)}
                    </Text>
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                        marginTop: 8,
                      }}
                    >
                      <Pressable onPress={() => setCartQty(item.product._id, item.qty - 1)}>
                        <Feather name="minus-circle" size={18} color={COLORS.muted} />
                      </Pressable>
                      <Text style={{ color: COLORS.text, fontWeight: "700" }}>{item.qty}</Text>
                      <Pressable onPress={() => setCartQty(item.product._id, item.qty + 1)}>
                        <Feather name="plus-circle" size={18} color={COLORS.muted} />
                      </Pressable>
                      <Pressable
                        onPress={() => setCartQty(item.product._id, 0)}
                        style={{ marginLeft: "auto" }}
                      >
                        <Text style={{ color: "#DC2626", fontSize: 12, fontWeight: "700" }}>
                          Remove
                        </Text>
                      </Pressable>
                    </View>
                  </View>
                ))
              )}

              <Text style={{ color: COLORS.text, fontWeight: "700", marginBottom: 12 }}>
                Total: {formatCurrency(cartTotal)}
              </Text>

              <TextInput
                placeholder="Customer name"
                value={orderForm.customerName}
                onChangeText={(value) =>
                  setOrderForm((prev) => ({ ...prev, customerName: value }))
                }
                style={shopCheckoutInputStyle}
              />
              <TextInput
                placeholder="Phone"
                value={orderForm.phone}
                onChangeText={(value) =>
                  setOrderForm((prev) => ({ ...prev, phone: value }))
                }
                keyboardType="phone-pad"
                style={shopCheckoutInputStyle}
              />
              <TextInput
                placeholder="Delivery address"
                value={orderForm.address}
                onChangeText={(value) =>
                  setOrderForm((prev) => ({ ...prev, address: value }))
                }
                multiline
                style={[
                  shopCheckoutInputStyle,
                  { minHeight: 80, textAlignVertical: "top" },
                ]}
              />
              <TextInput
                placeholder="Special instructions"
                value={orderForm.notes}
                onChangeText={(value) =>
                  setOrderForm((prev) => ({ ...prev, notes: value }))
                }
                multiline
                style={[
                  shopCheckoutInputStyle,
                  { minHeight: 70, textAlignVertical: "top" },
                ]}
              />

              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: 10,
                }}
              >
                <Text style={{ color: COLORS.text, fontSize: 14 }}>Inside Dhaka</Text>
                <Switch
                  value={orderForm.isInsideDhaka}
                  onValueChange={(value) =>
                    setOrderForm((prev) => ({ ...prev, isInsideDhaka: value }))
                  }
                />
              </View>

              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 10 }}>
                {[
                  "sleep_sheet",
                  "sleep_sheet_2",
                  "sleep_sheet_3",
                  "sleep_sheet_4",
                  "sleep_sheet_5",
                ].map((branch) => (
                  <Pressable
                    key={branch}
                    onPress={() => setOrderForm((prev) => ({ ...prev, branch }))}
                    style={{
                      paddingHorizontal: 10,
                      paddingVertical: 6,
                      borderRadius: 999,
                      borderWidth: 1,
                      borderColor:
                        orderForm.branch === branch ? COLORS.rose : COLORS.line,
                      backgroundColor:
                        orderForm.branch === branch ? "#FDF2F8" : "#fff",
                    }}
                  >
                    <Text style={{ color: COLORS.text, fontSize: 12 }}>{branch}</Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={placeOrder}
              disabled={submittingOrder}
              style={{
                marginTop: 10,
                backgroundColor: COLORS.rose,
                borderRadius: 10,
                paddingVertical: 12,
                alignItems: "center",
                opacity: submittingOrder ? 0.6 : 1,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 14, fontWeight: "700" }}>
                {submittingOrder ? "Placing Order..." : "Place Order"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AdminShell>
  );
}

const getShopInputStyle = (colors: typeof COLORS) => ({
  flex: 1,
  borderWidth: 1 as const,
  borderColor: colors.line,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: colors.text,
  backgroundColor: colors.panelBg,
});

const getShopCheckoutInputStyle = (colors: typeof COLORS) => ({
  borderWidth: 1 as const,
  borderColor: colors.line,
  borderRadius: 10,
  paddingHorizontal: 12,
  paddingVertical: 10,
  color: colors.text,
  backgroundColor: colors.panelBg,
  marginBottom: 10,
});

export function CustomersPage() {
  const { orders, loading } = useOrders({
    status: "all",
    deliveryStatus: "all",
    paymentStatus: "all",
  });
  const typedOrders = orders as Order[];

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 12;
  const customerMap = new Map<
    string,
    { name: string; phone?: string; count: number }
  >();
  typedOrders.forEach((o) => {
    const name = o.customerName || "Unknown";
    const phone = o.customerPhone || (o as any).phone || undefined;
    const key = phone ? `phone:${phone}` : `name:${name}`;
    const existing = customerMap.get(key);
    if (existing) {
      existing.count += 1;
      if (!existing.phone && phone) {
        existing.phone = phone;
      }
    } else {
      customerMap.set(key, { name, phone, count: 1 });
    }
  });

  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.count - a.count
  );
  const totalCustomers = customers.length;
  const totalPages = Math.max(1, Math.ceil(totalCustomers / pageSize));
  const pagedCustomers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return customers.slice(start, start + pageSize);
  }, [customers, currentPage]);

  React.useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleCall = (phone?: string) => {
    if (!phone) return;
    const digits = String(phone).replace(/[^\d+]/g, "");
    Linking.openURL(`tel:${digits}`).catch(() => {
      Alert.alert("Call Failed", "Could not open the dialer.");
    });
  };

  return (
    <AdminShell title="Customers" subtitle="Customer order frequency" activeRoute="/customers">
      <AdminCard title="Customers">
        {loading ? (
          <LoadingState />
        ) : pagedCustomers.length > 0 ? (
          pagedCustomers.map((customer) => (
            <View
              key={`${customer.name}-${customer.phone ?? "no-phone"}`}
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                borderTopWidth: 1,
                borderTopColor: COLORS.line,
                paddingVertical: 10,
                gap: 12,
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "600" }}>
                  {customer.name}
                </Text>
                {customer.phone ? (
                  <Pressable onPress={() => handleCall(customer.phone)}>
                    <Text style={{ color: COLORS.rose, fontSize: 12, marginTop: 2 }}>
                      {customer.phone}
                    </Text>
                  </Pressable>
                ) : (
                  <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 2 }}>
                    No phone
                  </Text>
                )}
              </View>
              <Text style={{ color: COLORS.muted, fontSize: 13 }}>
                {customer.count} orders
              </Text>
            </View>
          ))
        ) : (
          <Text style={{ color: COLORS.muted }}>No customers found.</Text>
        )}
      </AdminCard>

      {totalCustomers > pageSize ? (
        <View style={{ flexDirection: "row", justifyContent: "space-between", gap: 8 }}>
          <Text style={{ color: COLORS.muted, fontSize: 13 }}>
            {totalCustomers} customers · Page {currentPage} of {totalPages}
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <Pressable
              onPress={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLORS.line,
                backgroundColor: COLORS.panelBg,
                opacity: currentPage === 1 ? 0.5 : 1,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>Prev</Text>
            </Pressable>
            <Pressable
              onPress={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              style={{
                paddingHorizontal: 12,
                paddingVertical: 8,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: COLORS.line,
                backgroundColor: COLORS.panelBg,
                opacity: currentPage === totalPages ? 0.5 : 1,
              }}
            >
              <Text style={{ color: COLORS.text, fontSize: 12 }}>Next</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Text style={{ color: COLORS.muted, fontSize: 13 }}>
          {totalCustomers} customers
        </Text>
      )}
    </AdminShell>
  );
}

export function UsersPage() {
  return (
    <AdminShell title="Users" subtitle="Access and role management" activeRoute="/users">
      <AdminCard title="Users & Roles">
        <Text style={{ color: COLORS.text, fontSize: 14 }}>Admin</Text>
        <Text style={{ color: COLORS.text, fontSize: 14, marginTop: 6 }}>Manager</Text>
        <Text style={{ color: COLORS.text, fontSize: 14, marginTop: 6 }}>Viewer</Text>
      </AdminCard>
    </AdminShell>
  );
}

export function SettingsPage() {
  const { preference, resolvedScheme, setPreference } = useThemePreference();
  const themeOptions: Array<{ label: string; value: "system" | "light" | "dark" }> = [
    { label: "System", value: "system" },
    { label: "Light", value: "light" },
    { label: "Dark", value: "dark" },
  ];

  return (
    <AdminShell title="Settings" subtitle="Panel and account preferences" activeRoute="/settings">
      <AdminCard title="General Settings">
        <Text style={{ color: COLORS.text, fontSize: 14 }}>Notification alerts: Enabled</Text>
        <Text style={{ color: COLORS.text, fontSize: 14, marginTop: 6 }}>Auto refresh: Every 30 seconds</Text>
        <Text style={{ color: COLORS.text, fontSize: 14, marginTop: 6 }}>
          Theme: {resolvedScheme === "dark" ? "Dark" : "Light"}
        </Text>

        <View
          style={{
            marginTop: 12,
            borderTopWidth: 1,
            borderTopColor: COLORS.line,
            paddingTop: 12,
          }}
        >
          <Text style={{ color: COLORS.text, fontSize: 14, fontWeight: "600" }}>Theme Mode</Text>
          <Text style={{ color: COLORS.muted, fontSize: 12, marginTop: 4 }}>
            Choose light, dark, or follow the system setting.
          </Text>
          <View style={{ flexDirection: "row", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {themeOptions.map((option) => {
              const isActive = preference === option.value;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => setPreference(option.value)}
                  style={{
                    paddingVertical: 8,
                    paddingHorizontal: 12,
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: isActive ? COLORS.rose : COLORS.line,
                    backgroundColor: isActive ? COLORS.rose : COLORS.panelBg,
                  }}
                >
                  <Text
                    style={{
                      color: isActive ? "#fff" : COLORS.text,
                      fontSize: 13,
                      fontWeight: isActive ? "700" : "600",
                    }}
                  >
                    {option.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>
      </AdminCard>
    </AdminShell>
  );
}
