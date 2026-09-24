import type { Metadata } from "next";
import { CompaniesClient } from "@/components/company/companies-client";

export const metadata: Metadata = {
  title: "Companies | GSTTax",
  description: "Manage your registered companies",
};

export default function CompaniesPage() {
  return <CompaniesClient />;
}
