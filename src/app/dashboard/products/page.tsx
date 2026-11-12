import type { Metadata } from "next";
import { ProductsClient } from "@/components/product/products-client";
export const metadata: Metadata = { title: "Product Management | GSTTax", description: "Manage products, HSN, GST rates and stock" };
export default function ProductsPage() { return <ProductsClient />; }
