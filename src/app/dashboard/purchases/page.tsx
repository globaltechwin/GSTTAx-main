import type { Metadata } from "next";
import { PurchasesClient } from "@/components/purchase/purchases-client";

export const metadata: Metadata = {
  title: "Purchases | GSTTax",
  description: "Manage your purchase entries",
};

export default function PurchasesPage() {
  return <PurchasesClient />;
}
