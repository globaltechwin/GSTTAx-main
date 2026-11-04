import { InvoiceForm } from "@/components/invoice/invoice-form";
export default async function EditProformaInvoicePage({ params }: { params: Promise<{ id: string }> }) { const { id } = await params; return <InvoiceForm invoiceId={id} documentType="PROFORMA" />; }
