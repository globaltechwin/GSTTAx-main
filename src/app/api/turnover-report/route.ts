import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const FULL_MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

function currentFYStartYear() {
  const now = new Date();
  return now.getMonth() >= 3 ? now.getFullYear() : now.getFullYear() - 1;
}

interface SalesRow {
  sno: number;
  invoiceDate: Date;
  invoiceNo: string;
  partyName: string;
  gst: string;
  placeOfSupply: string;
  rate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

interface PurchaseRow {
  sno: number;
  gstNo: string;
  partyName: string;
  invoiceNo: string;
  invoiceDate: Date;
  state: string;
  rate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
}

interface Totals {
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  total: number;
}

async function fetchMonthData(startDate: Date, endDate: Date, snoStart: number) {
  const [invoices, purchases] = await Promise.all([
    prisma.invoice.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      orderBy: { date: "asc" },
      include: { company: true, toCompany: true, items: true },
    }),
    prisma.purchase.findMany({
      where: { invoiceDate: { gte: startDate, lte: endDate } },
      orderBy: { invoiceDate: "asc" },
    }),
  ]);

  const salesData: SalesRow[] = invoices.map((inv, i) => {
    const items = inv.items || [];
    const totalTaxable = items.reduce((s, it) => s + Number(it.amount || 0), 0) || Number(inv.amount || 0);

    let totalIgst = 0;
    let totalCgst = 0;
    let totalSgst = 0;

    if (items.length > 0) {
      for (const it of items) {
        const amt = Number(it.amount || 0);
        const itemTaxType = it.gstType || inv.taxType;
        if (itemTaxType === "IGST") {
          const rate = it.igstRate != null ? Number(it.igstRate) : Number(inv.igstRate || 0);
          totalIgst += amt * rate / 100;
        } else if (itemTaxType === "CGST_SGST") {
          const cRate = it.cgstRate != null ? Number(it.cgstRate) : Number(inv.cgstRate || 0);
          const sRate = it.sgstRate != null ? Number(it.sgstRate) : Number(inv.sgstRate || 0);
          totalCgst += amt * cRate / 100;
          totalSgst += amt * sRate / 100;
        }
      }
    } else {
      const igstR = Number(inv.igstRate || 0);
      const cgstR = Number(inv.cgstRate || 0);
      const sgstR = Number(inv.sgstRate || 0);
      totalIgst = totalTaxable * igstR / 100;
      totalCgst = totalTaxable * cgstR / 100;
      totalSgst = totalTaxable * sgstR / 100;
    }

    const total = totalTaxable + totalIgst + totalCgst + totalSgst;
    const rate = totalIgst > 0 ? (totalIgst / totalTaxable * 100) : ((totalCgst + totalSgst) / totalTaxable * 100);

    return {
      sno: snoStart + i + 1,
      invoiceDate: inv.date,
      invoiceNo: inv.invoiceNo || inv.orderId,
      partyName: inv.billToName || inv.toCompany?.name || inv.company?.name || "",
      gst: inv.billToGstin || inv.toCompany?.gstNo || inv.gst || "",
      placeOfSupply: inv.placeOfSupply || "",
      rate, taxableValue: totalTaxable, igst: totalIgst, cgst: totalCgst, sgst: totalSgst, total,
    };
  });

  const purchaseData: PurchaseRow[] = purchases.map((p, i) => ({
    sno: i + 1,
    gstNo: p.gstNo || "",
    partyName: p.partyName,
    invoiceNo: p.invoiceNo,
    invoiceDate: p.invoiceDate,
    state: p.state || "",
    rate: Number(p.rate),
    taxableValue: Number(p.taxableValue),
    igst: Number(p.igst),
    cgst: Number(p.cgst),
    sgst: Number(p.sgst),
    totalAmount: Number(p.totalAmount),
  }));

  const salesTotals = salesData.reduce<Totals>(
    (acc, s) => ({
      taxableValue: acc.taxableValue + s.taxableValue,
      igst: acc.igst + s.igst,
      cgst: acc.cgst + s.cgst,
      sgst: acc.sgst + s.sgst,
      total: acc.total + s.total,
    }),
    { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, total: 0 }
  );

  const purchaseTotals = purchaseData.reduce<Totals>(
    (acc, p) => ({
      taxableValue: acc.taxableValue + p.taxableValue,
      igst: acc.igst + p.igst,
      cgst: acc.cgst + p.cgst,
      sgst: acc.sgst + p.sgst,
      total: acc.total + p.totalAmount,
    }),
    { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, total: 0 }
  );

  return { salesData, purchaseData, salesTotals, purchaseTotals, invoiceCount: invoices.length, purchaseCount: purchases.length };
}

async function fetchYearlyMonthData(startDate: Date, endDate: Date) {
  const [invoices, purchases] = await Promise.all([
    prisma.invoice.findMany({ where: { date: { gte: startDate, lte: endDate } }, include: { items: true } }),
    prisma.purchase.findMany({ where: { invoiceDate: { gte: startDate, lte: endDate } } }),
  ]);

  let salesTaxable = 0;
  let salesIgst = 0;
  let salesCgst = 0;
  let salesSgst = 0;

  for (const inv of invoices) {
    const items = inv.items || [];
    if (items.length > 0) {
      for (const it of items) {
        const amt = Number(it.amount || 0);
        salesTaxable += amt;
        const itemTaxType = it.gstType || inv.taxType;
        if (itemTaxType === "IGST") {
          const rate = it.igstRate != null ? Number(it.igstRate) : Number(inv.igstRate || 0);
          salesIgst += amt * rate / 100;
        } else if (itemTaxType === "CGST_SGST") {
          const cRate = it.cgstRate != null ? Number(it.cgstRate) : Number(inv.cgstRate || 0);
          const sRate = it.sgstRate != null ? Number(it.sgstRate) : Number(inv.sgstRate || 0);
          salesCgst += amt * cRate / 100;
          salesSgst += amt * sRate / 100;
        }
      }
    } else {
      const amt = Number(inv.amount || 0);
      salesTaxable += amt;
      salesIgst += amt * Number(inv.igstRate || 0) / 100;
      salesCgst += amt * Number(inv.cgstRate || 0) / 100;
      salesSgst += amt * Number(inv.sgstRate || 0) / 100;
    }
  }

  const purTaxable = purchases.reduce((s, p) => s + Number(p.taxableValue), 0);
  const purIgst = purchases.reduce((s, p) => s + Number(p.igst), 0);
  const purCgst = purchases.reduce((s, p) => s + Number(p.cgst), 0);
  const purSgst = purchases.reduce((s, p) => s + Number(p.sgst), 0);

  return {
    sales: { taxableValue: salesTaxable, igst: salesIgst, cgst: salesCgst, sgst: salesSgst, totalTax: salesIgst + salesCgst + salesSgst },
    purchase: { taxableValue: purTaxable, igst: purIgst, cgst: purCgst, sgst: purSgst, totalTax: purIgst + purCgst + purSgst },
    availInput: {
      igst: salesIgst - purIgst,
      cgst: salesCgst - purCgst,
      sgst: salesSgst - purSgst,
      total: (salesIgst - purIgst) + (salesCgst - purCgst) + (salesSgst - purSgst),
    },
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get("type") || "month";
    const month = parseInt(searchParams.get("month") || String(new Date().getMonth() + 1), 10);
    const year = parseInt(searchParams.get("year") || String(new Date().getFullYear()), 10);
    const fyStartYear = parseInt(searchParams.get("fyStartYear") || String(currentFYStartYear()), 10);

    let allSalesData: SalesRow[] = [];
    let allPurchaseData: PurchaseRow[] = [];
    const salesTotals: Totals = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, total: 0 };
    const purchaseTotals: Totals = { taxableValue: 0, igst: 0, cgst: 0, sgst: 0, total: 0 };
    let monthLabel = "";
    let reportLabel = "";
    let snoOffset = 0;

    const fyMonths: Array<{ month: number; year: number; label: string }> = [];
    for (let i = 0; i < 12; i++) {
      const m = ((3 + i) % 12) + 1;
      const y = m >= 4 ? fyStartYear : fyStartYear + 1;
      fyMonths.push({ month: m, year: y, label: `${MONTH_NAMES[m - 1]}-${String(y).slice(2)}` });
    }

    if (reportType === "fy") {
      reportLabel = `FY ${fyStartYear}-${String(fyStartYear + 1).slice(2)}`;
      monthLabel = reportLabel;

      for (const fm of fyMonths) {
        const mStart = new Date(fm.year, fm.month - 1, 1);
        const mEnd = new Date(fm.year, fm.month, 0, 23, 59, 59);
        const result = await fetchMonthData(mStart, mEnd, snoOffset);
        snoOffset += result.invoiceCount;

        allSalesData.push(...result.salesData);
        allPurchaseData.push(...result.purchaseData);
        salesTotals.taxableValue += result.salesTotals.taxableValue;
        salesTotals.igst += result.salesTotals.igst;
        salesTotals.cgst += result.salesTotals.cgst;
        salesTotals.sgst += result.salesTotals.sgst;
        salesTotals.total += result.salesTotals.total;
        purchaseTotals.taxableValue += result.purchaseTotals.taxableValue;
        purchaseTotals.igst += result.purchaseTotals.igst;
        purchaseTotals.cgst += result.purchaseTotals.cgst;
        purchaseTotals.sgst += result.purchaseTotals.sgst;
        purchaseTotals.total += result.purchaseTotals.total;
      }
    } else {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 0, 23, 59, 59);
      const result = await fetchMonthData(startDate, endDate, 0);
      allSalesData = result.salesData;
      allPurchaseData = result.purchaseData;
      salesTotals.taxableValue = result.salesTotals.taxableValue;
      salesTotals.igst = result.salesTotals.igst;
      salesTotals.cgst = result.salesTotals.cgst;
      salesTotals.sgst = result.salesTotals.sgst;
      salesTotals.total = result.salesTotals.total;
      purchaseTotals.taxableValue = result.purchaseTotals.taxableValue;
      purchaseTotals.igst = result.purchaseTotals.igst;
      purchaseTotals.cgst = result.purchaseTotals.cgst;
      purchaseTotals.sgst = result.purchaseTotals.sgst;
      purchaseTotals.total = result.purchaseTotals.total;
      monthLabel = `${FULL_MONTHS[month - 1]} Month`;
    }

    const yearlyData = [];
    for (const fm of fyMonths) {
      const mStart = new Date(fm.year, fm.month - 1, 1);
      const mEnd = new Date(fm.year, fm.month, 0, 23, 59, 59);
      const ym = await fetchYearlyMonthData(mStart, mEnd);
      yearlyData.push({ month: fm.label, ...ym });
    }

    const availInput = {
      igst: salesTotals.igst - purchaseTotals.igst,
      cgst: salesTotals.cgst - purchaseTotals.cgst,
      sgst: salesTotals.sgst - purchaseTotals.sgst,
      total: (salesTotals.igst - purchaseTotals.igst) + (salesTotals.cgst - purchaseTotals.cgst) + (salesTotals.sgst - purchaseTotals.sgst),
    };

    const asPerCustomerCopy = {
      taxableValue: salesTotals.taxableValue - purchaseTotals.taxableValue,
      igst: Math.max(0, availInput.igst),
      cgst: Math.max(0, availInput.cgst),
      sgst: Math.max(0, availInput.sgst),
      total: Math.max(0, availInput.total),
    };

    const taxPayable = asPerCustomerCopy.total;

    return NextResponse.json({
      reportType,
      fyStartYear,
      month,
      year,
      monthLabel,
      reportLabel,
      salesData: allSalesData,
      purchaseData: allPurchaseData,
      salesTotals,
      purchaseTotals,
      availInput,
      asPerCustomerCopy,
      taxPayable,
      yearlyData,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to generate report";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
