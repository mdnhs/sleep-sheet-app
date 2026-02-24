import { OrdersPage } from "@/components/admin/adminPages";

export default function DeliveredOrdersScreen() {
  return <OrdersPage title="Delivered Orders" route="/delivered-orders" status="delivered" />;
}
