import { OrdersPage } from "@/components/admin/adminPages";

export default function ConfirmedOrdersScreen() {
  return <OrdersPage title="Confirmed Orders" route="/confirmed-orders" status="confirmed" />;
}
