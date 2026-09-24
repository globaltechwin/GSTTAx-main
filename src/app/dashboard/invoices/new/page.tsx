import { InvoiceForm } from "@/components/invoice/invoice-form";

export const metadata = {
  title: "Add Invoice | GSTTax",
  description: "Create a new invoice",
};

export default function AddInvoicePage() {
  return <InvoiceForm />;
}
