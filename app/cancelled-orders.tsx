import { OrdersPage } from "@/components/admin/adminPages";

export default function CancelledOrdersScreen() {
  return <OrdersPage title="Cancelled Orders" route="/cancelled-orders" status="cancelled" />;
}
