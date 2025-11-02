// api/updateOrder.ts

import { sanityClient } from "@/scripts/sanityClient";

export async function updateOrder(id: string, updates: Record<string, any>) {
  try {
    const res = await sanityClient.patch(id).set(updates).commit();
    return { success: true, res };
  } catch (error: any) {
    console.error("Sanity update failed:", error.message);
    return { success: false, error: error.message };
  }
}
