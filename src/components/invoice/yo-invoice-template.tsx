"use client";

import type { CSSProperties, ReactNode } from "react";
import type { InvoicePrintData } from "@/components/invoice/invoice-template";

const money = (value: number) => Number(value || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const date = (value: string | null | undefined) => value ? new Date(value).toLocaleDateString("en-GB") : "—";

function numberWords(value: number) {
  const whole = Math.floor(Math.abs(value) + 0.000001);
  const paise = Math.round((Math.abs(value) - whole) * 100);
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  const underThousand = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return `${tens[Math.floor(n / 10)]}${n % 10 ? ` ${ones[n % 10]}` : ""}`;
    return `${ones[Math.floor(n / 100)]} Hundred${n % 100 ? ` ${underThousand(n % 100)}` : ""}`;
  };
  const group = (n: number, unit: string) => n ? `${underThousand(n)} ${unit} ` : "";
  let n = whole;
  let result = group(Math.floor(n / 10000000), "Crore"); n %= 10000000;
  result += group(Math.floor(n / 100000), "Lakh"); n %= 100000;
  result += group(Math.floor(n / 1000), "Thousand"); n %= 1000;
  if (n) result += `${underThousand(n)} `;
  result = `${result.trim() || "Zero"} Rupees`;
  if (paise) result += ` and ${underThousand(paise)} Paise`;
  return `${result} Only`;
}

type Item = InvoicePrintData["items"][number];
const cell: CSSProperties = { border: "1px solid #777", padding: "3px 4px", verticalAlign: "top", overflowWrap: "anywhere" };
const head: CSSProperties = { ...cell, textAlign: "center", fontWeight: 700, verticalAlign: "middle" };
const label: CSSProperties = { fontWeight: 700 };
const right: CSSProperties = { textAlign: "right", whiteSpace: "nowrap" };
const table: CSSProperties = { width: "100%", borderCollapse: "collapse", tableLayout: "fixed" };

function CompanyLogo({ invoice, maxHeight = 76 }: { invoice: InvoicePrintData; maxHeight?: number }) {
  const src = invoice.company?.logoUrl || invoice.logoUrl;
  return src ? <img src={src} alt="Company logo" style={{ maxWidth: "100%", maxHeight, objectFit: "contain", display: "block" }} /> : null;
}
function SellerText({ invoice }: { invoice: InvoicePrintData }) {
  const c = invoice.company;
  return <>
    <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 3 }}>{c?.name || ""}</div>
    <div style={{ whiteSpace: "pre-line" }}>{c?.address || ""}</div>
    {c?.phone && <div>Phone: {c.phone}</div>}
    {(c?.state || c?.stateCode) && <div>State: {c?.state || ""}{c?.stateCode ? `    Code: ${c.stateCode}` : ""} India</div>}
    <div>GSTIN: {c?.gstNo || "—"}</div>
  </>;
}
function BuyerText({ invoice }: { invoice: InvoicePrintData }) {
  const buyer = invoice.billToCompany || invoice.toCompany;
  return <>
    <div style={{ fontWeight: 700 }}>{invoice.billToName || buyer?.name || ""}</div>
    <div style={{ whiteSpace: "pre-line" }}>{invoice.billToAddress || buyer?.address || ""}</div>
    <div>State: {invoice.billToState || buyer?.state || "—"} {invoice.billToStateCode || buyer?.stateCode || ""}</div>
    <div>GSTN: {invoice.billToGstin || buyer?.gstNo || "—"}</div>
  </>;
}
function Field({ name, value }: { name: string; value: ReactNode }) {
  return <tr><td style={{ ...cell, width: "48%", fontWeight: 700 }}>{name}</td><td style={cell}>{value || "—"}</td></tr>;
}
function Totals({ invoice, subtotal, discount, cgst, sgst, igst, total, proforma }: {
  invoice: InvoicePrintData; subtotal: number; discount: number; cgst: number; sgst: number; igst: number; total: number; proforma: boolean;
}) {
  const rows: [string, number, boolean?][] = [["Sub Total", subtotal], [proforma ? "Disc Amount" : "Discount Amount", discount]];
  if (proforma && igst > 0) rows.push(["IGST Amount", igst]);
  else {
    if (cgst > 0) rows.push(["CGST Amount", cgst]);
    if (sgst > 0) rows.push(["SGST Amount", sgst]);
    if (igst > 0) rows.push(["IGST Amount", igst]);
  }
  if (proforma && igst === 0 && (cgst + sgst) > 0) rows.push(["GST Amount", cgst + sgst]);
  return <table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}><tbody>
    {rows.map(([name, amount]) => <tr key={name}><td style={{ padding: "2px 3px", fontWeight: 700 }}>{name}</td><td style={{ ...right, padding: "2px 3px" }}>₹. {money(amount)}</td></tr>)}
    <tr><td style={{ padding: "4px 3px", fontWeight: 700 }}>Grand Total</td><td style={{ ...right, padding: "4px 3px", fontWeight: 700 }}>₹. {money(total)}</td></tr>
  </tbody></table>;
}

export function YoInvoiceTemplate({ invoice }: { invoice: InvoicePrintData }) {
  const proforma = invoice.documentType === "PROFORMA";
  const company = invoice.company;
  const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const discount = Math.min(Math.max(0, Number(invoice.discountAmount || 0)), subtotal);
  const discountFactor = subtotal > 0 ? (subtotal - discount) / subtotal : 0;
  let cgst = 0, sgst = 0, igst = 0;
  const taxRows = invoice.items.map((item) => {
    const base = Number(item.amount || 0) * discountFactor;
    const type = item.gstType || invoice.taxType;
    const cRate = Number(item.cgstRate ?? invoice.cgstRate ?? 0);
    const sRate = Number(item.sgstRate ?? invoice.sgstRate ?? 0);
    const iRate = Number(item.igstRate ?? invoice.igstRate ?? 0);
    const c = type === "CGST_SGST" ? base * cRate / 100 : 0;
    const s = type === "CGST_SGST" ? base * sRate / 100 : 0;
    const i = type === "IGST" ? base * iRate / 100 : 0;
    cgst += c; sgst += s; igst += i;
    return { base, type, tax: c + s + i, rate: cRate + sRate + iRate, igst: i };
  });
  const tax = cgst + sgst + igst;
  const exactTotal = subtotal - discount + tax;
  const total = Math.round(exactTotal);
  const roundOff = total - exactTotal;
  const due = total;
  const totalQty = invoice.items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const hsnMap = new Map<string, { hsn: string; rate: number; taxable: number; tax: number; type: string }>();
  invoice.items.forEach((item, index) => {
    const row = taxRows[index];
    const hsn = item.hsn || item.sac || "—";
    const key = `${hsn}|${row.rate}|${row.type}`;
    const current = hsnMap.get(key) || { hsn, rate: row.rate, taxable: 0, tax: 0, type: row.type };
    current.taxable += row.base; current.tax += row.tax; hsnMap.set(key, current);
  });
  const hsnRows = Array.from(hsnMap.values());
  const shell: CSSProperties = { width: "190mm", maxWidth: "190mm", minHeight: "277mm", margin: "0 auto", padding: "3mm", boxSizing: "border-box", background: "#fff", color: "#111", border: "1px solid #777", fontFamily: "Arial, Helvetica, sans-serif", fontSize: 10, lineHeight: 1.22 };
  const logoSrc = company?.logoUrl || invoice.logoUrl;

  const proformaDocument = <>
    <table style={table}><colgroup><col style={{ width: "76%" }}/><col style={{ width: "24%" }}/></colgroup><tbody>
      <tr>
        <td style={{ ...cell, height: 34, borderBottom: 0 }}><SellerText invoice={invoice}/></td>
        <td style={{ ...cell, borderBottom: 0, textAlign: "center", verticalAlign: "middle" }}><CompanyLogo invoice={invoice} maxHeight={88}/></td>
      </tr>
      <tr><td colSpan={2} style={{ ...head, fontSize: 15, padding: "5px" }}>Proforma Invoice</td></tr>
      <tr>
        <td style={cell}><BuyerText invoice={invoice}/></td>
        <td style={{ ...cell, padding: 0 }}><table style={{ width: "100%", borderCollapse: "collapse", tableLayout: "fixed" }}><tbody>
          <Field name="Proforma No" value={invoice.invoiceNo || invoice.orderId}/><Field name="Date" value={date(invoice.date)}/><Field name="PO No" value={invoice.poNumber || "—"}/><Field name="PO Date" value={date(invoice.poDate)}/>
        </tbody></table></td>
      </tr>
      <tr><td colSpan={2} style={cell}><b>Kind Attn :</b> {invoice.kindAttn || "—"}<span style={{ float: "right" }}><b>Mobile No :</b> {invoice.mobileNo || "—"}</span></td></tr>
      <tr><td colSpan={2} style={cell}><b>Dear Sir,</b><br/>We are pleased to confirm your order for the following product as per terms and conditions mentioned below.</td></tr>
    </tbody></table>
    <table style={{ ...table, marginTop: 0 }}><colgroup>{["5%","51%","10%","6%","8%","6%","6%","8%"].map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup><thead><tr>{["Sl No","Description of Goods","HSN Code","Qty","Rate","Per","Tax (%)","Amount"].map(h=><th key={h} style={head}>{h}</th>)}</tr></thead><tbody>
      {invoice.items.map((item,index)=><tr key={item.id || index} style={{ height: 25 }}><td style={{...cell,textAlign:"center"}}>{index+1}</td><td style={cell}>{item.description || ""}</td><td style={{...cell,textAlign:"center"}}>{item.hsn || item.sac || ""}</td><td style={{...cell,textAlign:"center"}}>{item.quantity}</td><td style={{...cell,...right}}>{money(Number(item.price || 0))}</td><td style={{...cell,textAlign:"center"}}>{item.per || item.unit || "Nos"}</td><td style={{...cell,textAlign:"center"}}>{taxRows[index].rate}%</td><td style={{...cell,...right}}>{money(Number(item.amount || 0))}</td></tr>)}
      <tr><td colSpan={3} style={{...cell,textAlign:"right",fontWeight:700}}>Total</td><td style={{...cell,textAlign:"center",fontWeight:700}}>{totalQty}</td><td colSpan={4} style={cell}/></tr>
    </tbody></table>
    <table style={{...table,marginTop:0}}><colgroup><col style={{width:"58%"}}/><col style={{width:"42%"}}/></colgroup><tbody><tr>
      <td style={cell}><b>Bank Detail</b><br/>BENEFICIARY NAME: {invoice.bankHolderName || company?.bankHolderName || company?.name || ""}<br/>BANK NAME: {invoice.bankName || company?.bankName || ""}<br/>A/C NO: {invoice.bankAccountNumber || company?.bankAccountNumber || ""}<br/>BRANCH: {invoice.bankBranchName || company?.bankBranchName || ""}<br/>IFSC CODE: {invoice.bankIfscCode || company?.bankIfscCode || ""}</td>
      <td style={{...cell,verticalAlign:"top"}}><Totals invoice={invoice} subtotal={subtotal} discount={discount} cgst={cgst} sgst={sgst} igst={igst} total={total} proforma/></td>
    </tr><tr><td colSpan={2} style={cell}><b>Amount Chargeable (In Words) :</b> {numberWords(total)}</td></tr><tr><td colSpan={2} style={{...cell,height:78,textAlign:"right",verticalAlign:"bottom",borderBottom:0}}><b>For {company?.name || ""}</b><br/><br/><br/>Authorised Signatory</td></tr></tbody></table>
  </>;

  const taxDocument = <>
    <div style={{ textAlign:"right",fontWeight:700,padding:"0 4px 3px" }}>Original - Buyer&apos;s copy</div>
    <table style={table}><colgroup><col style={{width:"58%"}}/><col style={{width:"21%"}}/><col style={{width:"21%"}}/></colgroup><tbody>
      <tr><td colSpan={3} style={head}>Tax Invoice</td></tr>
      <tr>
        <td style={cell}><div style={{display:"flex",gap:8,alignItems:"flex-start"}}>{logoSrc && <div style={{width:"24%",flexShrink:0,display:"flex",alignItems:"center",justifyContent:"center"}}><CompanyLogo invoice={invoice} maxHeight={86}/></div>}<div style={{flex:1,minWidth:0}}><SellerText invoice={invoice}/></div></div></td>
        <td style={{...cell,padding:0}}><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><tbody>
          <Field name="Invoice No." value={invoice.invoiceNo || invoice.orderId}/><Field name="Supplier Ref." value="—"/><Field name="Buyer’s Order No." value={invoice.poNumber || "—"}/><Field name="Delivery Challan No." value={invoice.challanNo || "—"}/><Field name="Delivered Through" value={invoice.transportMode || "—"}/>
        </tbody></table></td>
        <td style={{...cell,padding:0}}><table style={{width:"100%",borderCollapse:"collapse",tableLayout:"fixed"}}><tbody>
          <Field name="Dated" value={date(invoice.date)}/><Field name="Terms of Payment" value="Immediate Payment"/><Field name="Dated" value={date(invoice.poDate)}/><Field name="Dated" value={date(invoice.dateOfSupply)}/><Field name="Destination" value={invoice.placeOfSupply || "—"}/>
        </tbody></table></td>
      </tr>
      <tr><td colSpan={3} style={cell}><b>Buyer</b><br/><BuyerText invoice={invoice}/></td></tr>
    </tbody></table>
    <table style={{...table,marginTop:0}}><colgroup>{["5%","34%","10%","8%","6%","8%","9%","7%","6%","7%"].map((w,i)=><col key={i} style={{width:w}}/>)}</colgroup><thead><tr>{["S.No","Description of Goods","HSN/SAC","Quantity","UOM","Rate","Amount","Tax (%)","IGST / GST","Total"].map(h=><th key={h} style={head}>{h}</th>)}</tr></thead><tbody>
      {invoice.items.map((item,index)=>{const row=taxRows[index];const amount=Number(item.amount||0);return <tr key={item.id||index} style={{height:38}}><td style={{...cell,textAlign:"center"}}>{index+1}</td><td style={cell}>{item.description||""}</td><td style={{...cell,textAlign:"center"}}>{item.hsn||item.sac||""}</td><td style={{...cell,textAlign:"center"}}>{item.quantity}</td><td style={{...cell,textAlign:"center"}}>{item.per||item.unit||"Nos"}</td><td style={{...cell,...right}}>{money(Number(item.price||0))}</td><td style={{...cell,...right}}>{money(amount)}</td><td style={{...cell,textAlign:"center"}}>{row.rate}%</td><td style={{...cell,...right}}>{money(row.tax)}</td><td style={{...cell,...right}}>{money(amount+row.tax)}</td></tr>})}
      <tr><td colSpan={3} style={{...cell,textAlign:"right",fontWeight:700}}>Total</td><td style={{...cell,textAlign:"center",fontWeight:700}}>{totalQty}</td><td style={cell}/><td style={cell}/><td style={{...cell,...right,fontWeight:700}}>{money(subtotal)}</td><td style={cell}/><td style={{...cell,...right,fontWeight:700}}>{money(tax)}</td><td style={{...cell,...right,fontWeight:700}}>{money(subtotal+tax)}</td></tr>
    </tbody></table>
    <table style={{...table,marginTop:0}}><colgroup><col style={{width:"66%"}}/><col style={{width:"34%"}}/></colgroup><tbody>
      <tr><td style={cell}><b>Amount Chargeable (In Words) :</b> {numberWords(total)}</td><td style={cell}><div style={{display:"flex",justifyContent:"space-between"}}><b>Rounded Off:</b><span>₹. {money(roundOff)}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><b>Total Amount:</b><span>₹. {money(total)}</span></div><div style={{display:"flex",justifyContent:"space-between"}}><b>Due Amount:</b><span>₹. {money(due)}</span></div><div style={{textAlign:"right",fontWeight:700}}>Inclusive of All Taxes.</div></td></tr>
      <tr><td colSpan={2} style={cell}><b>HSN/SAC Tax Summary</b><table style={{...table,marginTop:3}}><colgroup><col style={{width:"25%"}}/><col style={{width:"25%"}}/><col style={{width:"25%"}}/><col style={{width:"25%"}}/></colgroup><thead><tr><th style={head}>HSN/SAC</th><th style={head}>Taxable Value</th><th style={head}>GST Rate</th><th style={head}>Tax Amount</th></tr></thead><tbody>{hsnRows.map((r,i)=><tr key={`${r.hsn}-${r.rate}-${i}`}><td style={cell}>{r.hsn}</td><td style={{...cell,...right}}>{money(r.taxable)}</td><td style={{...cell,textAlign:"center"}}>{r.rate}%</td><td style={{...cell,...right}}>{money(r.tax)}</td></tr>)}<tr><td style={{...cell,fontWeight:700}}>Total</td><td style={{...cell,...right,fontWeight:700}}>{money(hsnRows.reduce((s,r)=>s+r.taxable,0))}</td><td style={cell}/><td style={{...cell,...right,fontWeight:700}}>{money(tax)}</td></tr></tbody></table><div style={{marginTop:4}}><b>Tax Amount (In Words) :</b> {numberWords(tax)}</div></td></tr>
      <tr><td colSpan={2} style={cell}><b>Bank Detail</b><br/>BENEFICIARY: {invoice.bankHolderName || company?.bankHolderName || company?.name || ""}<br/>BANK NAME: {invoice.bankName || company?.bankName || ""}<br/>A/C NO: {invoice.bankAccountNumber || company?.bankAccountNumber || ""}<br/>IFSC CODE: {invoice.bankIfscCode || company?.bankIfscCode || ""}<br/>BRANCH: {invoice.bankBranchName || company?.bankBranchName || ""}</td></tr>
      <tr><td colSpan={2} style={cell}><b>Terms</b> {invoice.termsAndConditions || "All disputes subject to Chennai Jurisdiction only."}<br/><b>Declaration</b> Computerized generated Invoice. Signature not required <span style={{float:"right"}}>E &amp; OE</span></td></tr>
      <tr><td colSpan={2} style={{...cell,height:76,textAlign:"right",verticalAlign:"bottom",borderTop:0}}><b>For {company?.name||""}</b><br/><br/><br/>Authorised Signatory</td></tr>
    </tbody></table>
  </>;

  return <div id="invoice-print" className="yo-invoice-print" style={shell}>
    {proforma ? proformaDocument : taxDocument}
    <div style={{fontSize:9,marginTop:3}}>Page 1 of 1</div>
    <style>{`
      .yo-invoice-print, .yo-invoice-print * { box-sizing: border-box; }
      .yo-invoice-print table { page-break-inside: auto; }
      .yo-invoice-print tr { break-inside: avoid; page-break-inside: avoid; }
      @page { size: A4 portrait; margin: 0; }
      @media print {
        html, body { width: 210mm !important; min-width: 210mm !important; margin: 0 !important; padding: 0 !important; background: #fff !important; }
        #invoice-print.yo-invoice-print { width: 210mm !important; max-width: none !important; min-height: 297mm !important; margin: 0 !important; padding: 8mm 10mm !important; border: 0 !important; box-shadow: none !important; border-radius: 0 !important; font-size: 9.5px !important; }
        .yo-invoice-print table { width: 100% !important; }
      }
    `}</style>
  </div>;
}
