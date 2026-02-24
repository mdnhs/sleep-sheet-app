import { sanityClient } from "@/scripts/sanityClient";

type CartItem = {
  productId: string;
  quantity: number;
  unitPrice: number;
};

type AdminOrderPayload = {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  isInsideDhaka: boolean;
  specialInstructions?: string;
  branch?: string;
  items: CartItem[];
};

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

async function upsertCustomer(data: {
  name: string;
  phone: string;
  address: string;
  isInsideDhaka: boolean;
  notes?: string;
}) {
  const cleanedPhone = normalizePhone(data.phone);
  if (!cleanedPhone) return null;

  const existingCustomer = await sanityClient.fetch(
    `*[_type == "customer" && phone == $phone][0]{ _id }`,
    { phone: cleanedPhone }
  );

  if (existingCustomer?._id) {
    return sanityClient
      .patch(existingCustomer._id)
      .set({
        name: data.name,
        phone: cleanedPhone,
        address: data.address,
        isInsideDhaka: data.isInsideDhaka,
        notes: data.notes || "",
      })
      .commit();
  }

  return sanityClient.create({
    _type: "customer",
    name: data.name,
    phone: cleanedPhone,
    username: cleanedPhone,
    password: "123456",
    address: data.address,
    isInsideDhaka: data.isInsideDhaka,
    notes: data.notes || "",
    totalOrders: 0,
    lastOrderDate: null,
    isActive: true,
  });
}

export async function createAdminOrder(payload: AdminOrderPayload) {
  try {
    if (!payload.customerName.trim()) {
      return { success: false, error: "Customer name is required." };
    }
    if (!payload.phone.trim()) {
      return { success: false, error: "Phone is required." };
    }
    if (!payload.deliveryAddress.trim()) {
      return { success: false, error: "Delivery address is required." };
    }
    if (!payload.items.length) {
      return { success: false, error: "At least one product is required." };
    }

    const customer = await upsertCustomer({
      name: payload.customerName.trim(),
      phone: payload.phone.trim(),
      address: payload.deliveryAddress.trim(),
      isInsideDhaka: payload.isInsideDhaka,
      notes: payload.specialInstructions,
    });

    const totalPrice = payload.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0
    );

    const orderNumber = `ORD-${Date.now()}`;
    const orderDate = new Date().toISOString();

    const order = await sanityClient.create({
      _type: "order",
      orderNumber,
      branch: payload.branch || "sleep_sheet",
      customerName: payload.customerName.trim(),
      phone: normalizePhone(payload.phone),
      deliveryAddress: payload.deliveryAddress.trim(),
      isInsideDhaka: payload.isInsideDhaka,
      specialInstructions: payload.specialInstructions || "",
      products: payload.items.map((item, index) => ({
        _key: `${item.productId}-${index}-${Date.now().toString(36)}`,
        product: { _type: "reference", _ref: item.productId },
        quantity: item.quantity,
      })),
      totalPrice,
      paymentMethod: "cash_on_delivery",
      status: "pending",
      paymentStatus: "pending",
      deliveryStatus: "pending",
      orderDate,
      ...(customer?._id && {
        customer: {
          _type: "reference",
          _ref: customer._id,
        },
      }),
    });

    if (customer?._id) {
      await sanityClient
        .patch(customer._id)
        .inc({ totalOrders: 1 })
        .set({ lastOrderDate: orderDate })
        .commit();
    }

    return {
      success: true,
      order: {
        _id: order._id,
        orderNumber: order.orderNumber,
      },
    };
  } catch (error: any) {
    console.error("createAdminOrder failed:", error?.message);
    return { success: false, error: error?.message ?? "Unknown error" };
  }
}
