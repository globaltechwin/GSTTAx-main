import { InvoiceClient } from "@/components/invoice/invoice-client";
export const metadata = { title: "Proforma Invoices | GSTTax", description: "Manage proforma invoices" };
export default function ProformaInvoicesPage() { return <InvoiceClient documentType="PROFORMA" />; }
