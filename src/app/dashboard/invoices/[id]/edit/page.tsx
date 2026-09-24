"use client";

import { InvoiceForm } from "@/components/invoice/invoice-form";
import { useParams } from "next/navigation";

export default function EditInvoicePage() {
  const params = useParams();
  const id = params.id as string;
  return <InvoiceForm invoiceId={id} />;
}
