import { NextResponse } from "next/server";
import { requireApiAccess } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const access = await requireApiAccess(request, "invoices");
  if (access instanceof NextResponse) return access;
  if (access.user.role === "SUPERADMIN") {
    return NextResponse.json(
      { error: "Invoice numbering is workspace-specific and unavailable in read-only platform views" },
      { status: 403 }
    );
  }
  try {
    const [sequence, existingNumbers] = await Promise.all([
      prisma.invoiceSequence.findUnique({
        where: { adminId: access.user.workspaceId! },
        select: { currentValue: true },
      }),
      prisma.invoice.findMany({
        where: { adminId: access.user.workspaceId },
        select: { invoiceNo: true },
      }),
    ]);
    const maxExisting = existingNumbers.reduce((maximum, invoice) => {
      const parsed = Number.parseInt(invoice.invoiceNo ?? "", 10);
      return Number.isSafeInteger(parsed) ? Math.max(maximum, parsed) : maximum;
    }, 0);
    const nextNum = Math.max(sequence?.currentValue ?? 0, maxExisting) + 1;

    return NextResponse.json({ nextInvoiceNo: String(nextNum) });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to get next invoice number";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
