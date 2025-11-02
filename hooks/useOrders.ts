// hooks/useOrders.ts
import { sanityClient } from "@/scripts/sanityClient";
import { useEffect, useState } from "react";

export const useOrders = (filters: {
  status?: string;
  deliveryStatus?: string;
  paymentStatus?: string;
}) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    const whereClauses = [];
    if (filters.status && filters.status !== "all")
      whereClauses.push(`status == "${filters.status}"`);
    if (filters.deliveryStatus && filters.deliveryStatus !== "all")
      whereClauses.push(`deliveryStatus == "${filters.deliveryStatus}"`);
    if (filters.paymentStatus && filters.paymentStatus !== "all")
      whereClauses.push(`paymentStatus == "${filters.paymentStatus}"`);

    const where =
      whereClauses.length > 0 ? `&& ${whereClauses.join(" && ")}` : "";

    const query = `*[_type == "order" ${where}] | order(orderDate desc) {
      _id,
      orderNumber,
      customerName,
      phone,
      deliveryAddress,
      status,
      deliveryStatus,
      paymentStatus,
      totalPrice,
      orderDate,
      products[]{
        quantity,
        product->{
          name,
          price,
          "image": image.asset->url
        }
      }
    }`;

    try {
      const data = await sanityClient.fetch(query);
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [filters]);

  return { orders, loading, refetch: fetchOrders };
};
