"use client";

import { useState } from "react";
import * as XLSX from "xlsx-js-style";
import { BarChart3, Download, ChevronRight, Loader2 } from "lucide-react";

const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_SHORT = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 7 }, (_, i) => currentYear - 3 + i);

function fmt(n: number) { return Math.round(n).toLocaleString("en-IN"); }
function currentFYStart() { return new Date().getMonth() >= 3 ? currentYear : currentYear - 1; }

type S = XLSX.CellStyle;
interface SalesRow { sno: number; invoiceDate: string; invoiceNo: string; partyName: string; gst: string; placeOfSupply: string; rate: number; taxableValue: number; igst: number; cgst: number; sgst: number; total: number; }
interface PurchaseRow { sno: number; gstNo: string; partyName: string; invoiceNo: string; invoiceDate: string; state: string; rate: number; taxableValue: number; igst: number; cgst: number; sgst: number; totalAmount: number; }
interface YearlyRow { month: string; sales: { taxableValue: number; igst: number; cgst: number; sgst: number; totalTax: number }; purchase: { taxableValue: number; igst: number; cgst: number; sgst: number; totalTax: number }; availInput: { igst: number; cgst: number; sgst: number; total: number }; }

function c(v: string | number, s?: S): XLSX.CellObject { return { t: typeof v === "number" ? "n" : "s", v, s: s || {} } as XLSX.CellObject; }

const bc = { rgb: "000000" };
const thinB = { top: { style: "thin" as const, color: bc }, bottom: { style: "thin" as const, color: bc }, left: { style: "thin" as const, color: bc }, right: { style: "thin" as const, color: bc } };
const thickB = { top: { style: "medium" as const, color: bc }, bottom: { style: "medium" as const, color: bc }, left: { style: "medium" as const, color: bc }, right: { style: "medium" as const, color: bc } };

const sRedBold: S = { font: { bold: true, color: { rgb: "FF0000" }, sz: 14 }, alignment: { horizontal: "center" } };
const sSubTitle: S = { font: { sz: 10, italic: true } };
const sHdrBlue: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "1F4E79" }, patternType: "solid" }, alignment: { horizontal: "center", vertical: "center" }, border: thinB };
const sHdrBlueL: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "1F4E79" }, patternType: "solid" }, border: thinB };
const sDc: S = { border: thinB, alignment: { horizontal: "center" } };
const sDl: S = { border: thinB };
const sDrBold: S = { font: { bold: true }, border: thinB, alignment: { horizontal: "right" } };
const sBoldR: S = { font: { bold: true }, alignment: { horizontal: "right" } };
const sBold: S = { font: { bold: true } };
const sThickR: S = { font: { bold: true }, border: thickB, alignment: { horizontal: "right" } };
const sThickC: S = { font: { bold: true }, border: thickB, alignment: { horizontal: "center" } };

export function TurnoverReportClient() {
  const [reportType, setReportType] = useState<"month" | "fy">("month");
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [year, setYear] = useState(currentYear);
  const [fyStartYear, setFyStartYear] = useState(currentFYStart());
  const [loading, setLoading] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: reportType, month: String(month), year: String(year), fyStartYear: String(fyStartYear) });
      const res = await fetch(`/api/turnover-report?${params}`);
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      generateExcel(data);
    } catch { alert("Failed to generate report."); }
    finally { setLoading(false); }
  };

  function generateExcel(data: Record<string, unknown>) {
    const sd = data.salesData as SalesRow[];
    const pd = data.purchaseData as PurchaseRow[];
    const sT = data.salesTotals as Record<string, number>;
    const pT = data.purchaseTotals as Record<string, number>;
    const ai = data.availInput as Record<string, number>;
    const apc = data.asPerCustomerCopy as Record<string, number>;
    const tp = data.taxPayable as number;
    const mL = data.monthLabel as string;
    const yd = data.yearlyData as YearlyRow[];

    const R: XLSX.CellObject[][] = [];
    const NC = 12;
    const empty = () => Array(NC).fill(null).map(() => c(""));

    R.push(empty());
    const r1 = empty(); r1[0] = c("Sales", sRedBold); R.push(r1);
    const r2 = empty(); r2[0] = c("3.1 (a) Outward taxable supplies (other than zero rated, nil rated and exempted)", sSubTitle); R.push(r2);

    const sHdr = ["S.NO","INVOICE DATE","INVOICE NO","PARTY NAME","GST","PLACE OF SUPPLY","RATE %","TAXABLE VALUE","IGST","CGST","SGST","TOTAL"];
    R.push(sHdr.map((h, i) => c(h, i <= 5 ? sHdrBlueL : sHdrBlue)));

    for (let i = 0; i < sd.length; i++) {
      const s = sd[i];
      const dte = new Date(s.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const stripe = i % 2 === 1 ? { bg: "F2F2F2" } : undefined;
      const base = stripe ? { ...sDc, fill: { fgColor: { rgb: stripe.bg }, patternType: "solid" as const } } : sDc;
      const baseL = stripe ? { ...sDl, fill: { fgColor: { rgb: stripe.bg }, patternType: "solid" as const } } : sDl;
      R.push([c(s.sno, base), c(dte, base), c(s.invoiceNo, baseL), c(s.partyName, baseL), c(s.gst, baseL), c(s.placeOfSupply, baseL), c(`${s.rate}%`, base), c(fmt(s.taxableValue), base), c(fmt(s.igst), base), c(fmt(s.cgst), base), c(fmt(s.sgst), base), c(fmt(s.total), base)]);
    }

    const sTotalRow = empty();
    sTotalRow[6] = c("TOTAL", sDrBold); sTotalRow[7] = c(fmt(sT.taxableValue), sDrBold); sTotalRow[8] = c(fmt(sT.igst), sDrBold); sTotalRow[9] = c(fmt(sT.cgst), sDrBold); sTotalRow[10] = c(fmt(sT.sgst), sDrBold); sTotalRow[11] = c(fmt(sT.total), sDrBold);
    R.push(sTotalRow);
    R.push(empty());

    const purchaseTitleRowIdx = 6 + sd.length;
    const pTitleRow = empty(); pTitleRow[0] = c("Purchase", sRedBold); R.push(pTitleRow);
    const pHdr = ["S No","Gst No","Party Name","Invoice No","Invoice Date","State","Rate","Taxable Value","IGST","CGST","SGST","Total Invoice Value"];
    R.push(pHdr.map((h) => c(h, sHdrBlue)));

    for (let i = 0; i < pd.length; i++) {
      const p = pd[i];
      const dte = new Date(p.invoiceDate).toLocaleDateString("en-IN", { day: "2-digit", month: "2-digit", year: "2-digit" });
      const stripe = i % 2 === 1;
      const bgFill = stripe ? { fgColor: { rgb: "F2F2F2" }, patternType: "solid" as const } : undefined;
      const centered: S = { border: thinB, alignment: { horizontal: "center" }, ...(bgFill ? { fill: bgFill } : {}) };
      R.push([c(p.sno, centered), c(p.gstNo, centered), c(p.partyName, centered), c(p.invoiceNo, centered), c(dte, centered), c(p.state, centered), c(`${p.rate}%`, centered), c(fmt(p.taxableValue), centered), c(fmt(p.igst), centered), c(fmt(p.cgst), centered), c(fmt(p.sgst), centered), c(fmt(p.totalAmount), centered)]);
    }

    const pTotalRow = empty();
    pTotalRow[6] = c("TOTAL", sDrBold); pTotalRow[7] = c(fmt(pT.taxableValue), sDrBold); pTotalRow[8] = c(fmt(pT.igst), sDrBold); pTotalRow[9] = c(fmt(pT.cgst), sDrBold); pTotalRow[10] = c(fmt(pT.sgst), sDrBold); pTotalRow[11] = c(fmt(pT.total), sDrBold);
    R.push(pTotalRow);
    R.push(empty());
    R.push(empty());

    const purchaseTotalRowIdx = purchaseTitleRowIdx + 1 + pd.length + 1;

    const calcHdr = empty();
    calcHdr[4] = c("Month", sBold); calcHdr[5] = c(mL, sBold);
    calcHdr[7] = c("Taxable", sBold); calcHdr[8] = c("IGST", sBold); calcHdr[9] = c("CGST", sBold); calcHdr[10] = c("SGST", sBold); calcHdr[11] = c("Total Tax", sBold);
    R.push(calcHdr);

    const calcSales = empty(); calcSales[4] = c("Sales", sBold); calcSales[7] = c(fmt(sT.taxableValue), sBoldR); calcSales[8] = c(fmt(sT.igst), sBoldR); calcSales[9] = c(fmt(sT.cgst), sBoldR); calcSales[10] = c(fmt(sT.sgst), sBoldR); calcSales[11] = c(fmt(sT.igst + sT.cgst + sT.sgst), sBoldR);
    R.push(calcSales);

    const calcPur = empty(); calcPur[4] = c("Purchase", sBold); calcPur[7] = c(fmt(pT.taxableValue), sBoldR); calcPur[8] = c(fmt(pT.igst), sBoldR); calcPur[9] = c(fmt(pT.cgst), sBoldR); calcPur[10] = c(fmt(pT.sgst), sBoldR); calcPur[11] = c(fmt(pT.igst + pT.cgst + pT.sgst), sBoldR);
    R.push(calcPur);

    const calcAvail = empty(); calcAvail[4] = c("Avail Input", sThickC); calcAvail[8] = c(fmt(ai.igst), sThickR); calcAvail[9] = c(fmt(ai.cgst), sThickR); calcAvail[10] = c(fmt(ai.sgst), sThickR); calcAvail[11] = c(fmt(ai.total), sThickR);
    R.push(calcAvail);
    R.push(empty());

    const calcCust = empty(); calcCust[4] = c("As per Customer Copy", sThickC); calcCust[7] = c(fmt(apc.taxableValue), sThickR); calcCust[8] = c(fmt(apc.igst), sThickR); calcCust[9] = c(fmt(apc.cgst), sThickR); calcCust[10] = c(fmt(apc.sgst), sThickR); calcCust[11] = c(fmt(apc.total), sThickR);
    R.push(calcCust);

    const calcGst = empty(); calcGst[4] = c("As GST Site Copy", sThickC); calcGst[7] = c(fmt(apc.taxableValue), sThickR); calcGst[8] = c(fmt(apc.igst), sThickR); calcGst[9] = c(fmt(apc.cgst), sThickR); calcGst[10] = c(fmt(apc.sgst), sThickR); calcGst[11] = c(fmt(apc.total), sThickR);
    R.push(calcGst);
    R.push(empty());

    const taxRow = empty(); taxRow[6] = c("Tax Payable", { font: { bold: true, sz: 12 } }); taxRow[7] = c(fmt(tp), { font: { bold: true, sz: 12 } });
    R.push(taxRow);
    R.push(empty());
    R.push(empty());

    const YNC = 17;
    const yEmpty = () => Array(YNC).fill(null).map(() => c(""));

    const yTitle = yEmpty(); yTitle[0] = c("Yearly Report / Month Wise Range", { font: { bold: true, sz: 13 }, alignment: { horizontal: "center" } }); R.push(yTitle);
    R.push(yEmpty());

    const ySec = yEmpty();
    ySec[1] = c("Sales Yearly", { font: { bold: true, color: { rgb: "FF0000" }, sz: 11 }, alignment: { horizontal: "center" } });
    ySec[6] = c("Purchase Yearly", { font: { bold: true, color: { rgb: "FF0000" }, sz: 11 }, alignment: { horizontal: "center" } });
    ySec[11] = c("Avail Input", { font: { bold: true, color: { rgb: "FF0000" }, sz: 11 }, alignment: { horizontal: "center" } });
    ySec[15] = c("Tax", { font: { bold: true, color: { rgb: "FF0000" }, sz: 11 }, alignment: { horizontal: "center" } });
    R.push(ySec);

    const monthsHdr: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "333333" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const salesHdr: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "0097A7" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const purTaxableHdr: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "7B1FA2" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const purHdr: S = { font: { bold: true, color: { rgb: "FFFFFF" }, sz: 10 }, fill: { fgColor: { rgb: "0097A7" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const availHdr: S = { font: { bold: true, color: { rgb: "000000" }, sz: 10 }, fill: { fgColor: { rgb: "C8E6C9" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const taxHdrIgst: S = { font: { bold: true, color: { rgb: "000000" }, sz: 10 }, fill: { fgColor: { rgb: "FFF9C4" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };
    const taxHdrCgst: S = { font: { bold: true, color: { rgb: "000000" }, sz: 10 }, fill: { fgColor: { rgb: "C8E6C9" }, patternType: "solid" }, alignment: { horizontal: "center" }, border: thinB };

    R.push([
      c("MONTHS", monthsHdr),
      c("Taxable Value", salesHdr), c("IGST", salesHdr), c("CGST", salesHdr), c("SGST", salesHdr), c("Total Tax", salesHdr),
      c("Taxable Value", purTaxableHdr), c("IGST", purHdr), c("CGST", purHdr), c("SGST", purHdr), c("Total Tax", purHdr),
      c("IGST", availHdr), c("CGST", availHdr), c("SGST", availHdr), c("Total", availHdr),
      c("IGST", taxHdrIgst), c("CGST", taxHdrCgst),
    ]);

    const mkS = (bg: string): S => ({ fill: { fgColor: { rgb: bg }, patternType: "solid" }, border: thinB, alignment: { horizontal: "right" } });

    for (let i = 0; i < yd.length; i++) {
      const m = yd[i];
      const stripe = i % 2 === 1;
      const bgLight = stripe ? "F5F5F5" : "FFFFFF";
      const monthCell: S = { fill: { fgColor: { rgb: bgLight }, patternType: "solid" }, border: thinB, alignment: { horizontal: "center" } };

      R.push([
        c(m.month, monthCell),
        c(fmt(m.sales.taxableValue), mkS("E0F7FA")), c(fmt(m.sales.igst), mkS("E0F7FA")), c(fmt(m.sales.cgst), mkS("E0F7FA")), c(fmt(m.sales.sgst), mkS("E0F7FA")), c(fmt(m.sales.totalTax), mkS("E0F7FA")),
        c(fmt(m.purchase.taxableValue), mkS("E1BEE7")), c(fmt(m.purchase.igst), mkS("E0F7FA")), c(fmt(m.purchase.cgst), mkS("E0F7FA")), c(fmt(m.purchase.sgst), mkS("E0F7FA")), c(fmt(m.purchase.totalTax), mkS("E0F7FA")),
        c(fmt(m.availInput.igst), mkS("E8F5E9")), c(fmt(m.availInput.cgst), mkS("E8F5E9")), c(fmt(m.availInput.sgst), mkS("E8F5E9")), c(fmt(m.availInput.total), mkS("E8F5E9")),
        c(fmt(Math.max(0, m.availInput.igst)), mkS("FFF9C4")), c(fmt(Math.max(0, m.availInput.cgst)), mkS("E8F5E9")),
      ]);
    }

    const totHdr: S = { font: { bold: true }, fill: { fgColor: { rgb: "D5D5D5" }, patternType: "solid" }, border: thinB, alignment: { horizontal: "right" } };
    const totHdrC: S = { font: { bold: true }, fill: { fgColor: { rgb: "D5D5D5" }, patternType: "solid" }, border: thinB, alignment: { horizontal: "center" } };

    R.push([
      c("TOTAL", totHdrC),
      c(fmt(yd.reduce((a, y) => a + y.sales.taxableValue, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.sales.igst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.sales.cgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.sales.sgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.sales.totalTax, 0)), totHdr),
      c(fmt(yd.reduce((a, y) => a + y.purchase.taxableValue, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.purchase.igst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.purchase.cgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.purchase.sgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.purchase.totalTax, 0)), totHdr),
      c(fmt(yd.reduce((a, y) => a + y.availInput.igst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.availInput.cgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.availInput.sgst, 0)), totHdr), c(fmt(yd.reduce((a, y) => a + y.availInput.total, 0)), totHdr),
      c(fmt(Math.max(0, yd.reduce((a, y) => a + y.availInput.igst, 0))), totHdr), c(fmt(Math.max(0, yd.reduce((a, y) => a + y.availInput.cgst, 0))), totHdr),
    ]);

    const ws = XLSX.utils.aoa_to_sheet(R);

    ws["!cols"] = [{ wch: 6 },{ wch: 30 },{ wch: 30 },{ wch: 30 },{ wch: 22 },{ wch: 22 },{ wch: 10 },{ wch: 16 },{ wch: 14 },{ wch: 14 },{ wch: 14 },{ wch: 20 }];

    ws["!merges"] = [
      { s: { r: 1, c: 0 }, e: { r: 1, c: NC - 1 } },
      { s: { r: purchaseTitleRowIdx, c: 0 }, e: { r: purchaseTitleRowIdx, c: NC - 1 } },
    ];

    const outerTop = 1;
    const outerBottom = purchaseTotalRowIdx;
    for (let r = outerTop; r <= outerBottom; r++) {
      for (let col = 0; col < NC; col++) {
        const addr = XLSX.utils.encode_cell({ r, c: col });
        if (!ws[addr]) ws[addr] = c("", {});
        const cell = ws[addr] as XLSX.CellObject;
        if (!cell.s) cell.s = {} as S;
        const st = cell.s as Record<string, unknown>;
        const borders = { color: bc };
        if (r === outerTop) st.border = { ...(st.border as Record<string, unknown>), top: { style: "medium" as const, ...borders } };
        if (r === outerBottom) st.border = { ...(st.border as Record<string, unknown>), bottom: { style: "medium" as const, ...borders } };
        if (col === 0) st.border = { ...(st.border as Record<string, unknown>), left: { style: "medium" as const, ...borders } };
        if (col === NC - 1) st.border = { ...(st.border as Record<string, unknown>), right: { style: "medium" as const, ...borders } };
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Turnover Report");
    const fyLabel = reportType === "fy" ? `FY${fyStartYear}-${String(fyStartYear + 1).slice(2)}` : `${MONTH_SHORT[month - 1]}-${year}`;
    XLSX.writeFile(wb, `Turnover-Report-${fyLabel}.xlsx`);
  }

  return (
    <div className="space-y-6">
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <a href="/dashboard" className="hover:text-foreground transition-colors">Home</a>
        <ChevronRight className="size-3.5" />
        <span className="text-foreground font-medium">Turnover Report</span>
      </nav>

      <div className="flex items-center gap-3">
        <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
          <BarChart3 className="text-primary size-5" />
        </div>
        <div>
          <h1 className="text-foreground text-xl font-bold tracking-tight">Turnover Report</h1>
          <p className="text-muted-foreground mt-0.5 text-sm">Generate GST turnover report with Sales &amp; Purchase summaries</p>
        </div>
      </div>

      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <div className="flex flex-col gap-6">
          <div className="space-y-2">
            <label className="text-foreground text-sm font-semibold">Report Type</label>
            <div className="flex gap-2">
              <button onClick={() => setReportType("month")} className={`h-10 px-5 rounded-xl text-sm font-semibold transition-all ${reportType === "month" ? "bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card border hover:bg-muted"}`}>Monthly</button>
              <button onClick={() => setReportType("fy")} className={`h-10 px-5 rounded-xl text-sm font-semibold transition-all ${reportType === "fy" ? "bg-primary text-primary-foreground shadow-sm" : "border-border/60 bg-card border hover:bg-muted"}`}>Financial Year</button>
            </div>
          </div>

          {reportType === "month" && (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-foreground text-sm font-semibold">Month</label>
                <div className="relative">
                  <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="border-border/60 bg-card focus:ring-primary/20 h-11 w-full appearance-none rounded-xl border py-2.5 pr-8 pl-4 text-sm transition-all focus:ring-2 focus:outline-none">
                    {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                  </select>
                  <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"><svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-foreground text-sm font-semibold">Year</label>
                <div className="relative">
                  <select value={year} onChange={(e) => setYear(Number(e.target.value))} className="border-border/60 bg-card focus:ring-primary/20 h-11 w-full appearance-none rounded-xl border py-2.5 pr-8 pl-4 text-sm transition-all focus:ring-2 focus:outline-none">
                    {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"><svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
                </div>
              </div>
            </div>
          )}

          {reportType === "fy" && (
            <div className="space-y-2">
              <label className="text-foreground text-sm font-semibold">Financial Year (Apr - Mar)</label>
              <div className="relative">
                <select value={fyStartYear} onChange={(e) => setFyStartYear(Number(e.target.value))} className="border-border/60 bg-card focus:ring-primary/20 h-11 w-full appearance-none rounded-xl border py-2.5 pr-8 pl-4 text-sm transition-all focus:ring-2 focus:outline-none">
                  {YEARS.map((y) => <option key={y} value={y}>FY {y}-{String(y + 1).slice(2)}</option>)}
                </select>
                <div className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2"><svg className="text-muted-foreground size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg></div>
              </div>
            </div>
          )}

          <div className="flex items-center gap-4">
            <button onClick={handleGenerate} disabled={loading} className="btn-gradient text-primary-foreground inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold shadow-sm transition-all disabled:opacity-50">
              {loading ? <><Loader2 className="size-4 animate-spin" />Generating...</> : <><Download className="size-4" />Generate &amp; Download Report</>}
            </button>
            <span className="text-muted-foreground text-sm">
              {reportType === "month" ? <>Report for <span className="text-foreground font-semibold">{MONTHS[month - 1]} {year}</span></> : <>Report for <span className="text-foreground font-semibold">FY {fyStartYear}-{String(fyStartYear + 1).slice(2)}</span></>}
            </span>
          </div>
        </div>
      </div>

      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <h3 className="text-foreground mb-3 text-sm font-semibold">Report Contents</h3>
        <div className="rounded-xl border border-blue-500/20 bg-blue-500/5 p-4">
          <p className="text-foreground text-sm font-semibold">Single Sheet — Turnover Report</p>
          <p className="text-muted-foreground mt-1 text-xs">Sales table, Purchase table, Calculations, Avail Input, Tax Payable, and Yearly Report (Apr-Mar) all on one sheet</p>
        </div>
      </div>
    </div>
  );
}
