import { InvoiceClient } from "@/components/invoice/invoice-client";

export const metadata = {
  title: "Invoices | GSTTax",
  description: "Manage your invoices and billing records",
};

export default function InvoicesPage() {
  return <InvoiceClient />;
}
