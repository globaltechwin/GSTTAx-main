import { InvoiceForm } from "@/components/invoice/invoice-form";
export const metadata = { title: "Create Proforma Invoice | GSTTax" };
export default function NewProformaInvoicePage() { return <InvoiceForm documentType="PROFORMA" />; }
