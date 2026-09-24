import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  try {
    const result = await prisma.invoice.findFirst({
      orderBy: { invoiceNo: "desc" },
      select: { invoiceNo: true },
    });

    const maxNum = result?.invoiceNo ? parseInt(result.invoiceNo, 10) || 0 : 0;
    const nextNum = maxNum + 1;

    return NextResponse.json({ nextInvoiceNo: String(nextNum) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get next invoice number";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
