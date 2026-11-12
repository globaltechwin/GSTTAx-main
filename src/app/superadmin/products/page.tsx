import type { Metadata } from "next";
import { SuperadminProductsClient } from "@/components/superadmin/products-client";

export const metadata: Metadata = {
  title: "Products | GSTTax Superadmin",
  description: "View products across Admin workspaces",
};

export default function SuperadminProductsPage() {
  return <SuperadminProductsClient />;
}
