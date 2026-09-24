"use client";

import { useMemo } from "react";

export type TaxType = "CGST_SGST" | "IGST" | "WITHOUT_GST";

export interface InvoiceItemData {
  id: number;
  description: string | null;
  hsn: string | null;
  sac: string | null;
  quantity: number;
  unit: string;
  price: number;
  per: string;
  amount: number;
  gstType?: string | null;
  igstRate?: number | null;
  cgstRate?: number | null;
  sgstRate?: number | null;
}

export interface InvoiceCompanyData {
  id: number;
  name: string;
  gstNo: string | null;
  panNo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  state: string | null;
  stateCode: string | null;
  bankHolderName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankName: string | null;
  bankBranchName: string | null;
  website: string | null;
}

export interface InvoiceToCompanyData {
  id: number;
  name: string;
  gstNo: string | null;
  email: string | null;
  address: string | null;
  state: string | null;
  stateCode: string | null;
}

export interface InvoicePrintData {
  id: number;
  orderId: string;
  invoiceNo: string | null;
  email: string | null;
  gst: string | null;
  amount: number | null;
  total: number | null;
  date: string;
  taxType: TaxType;
  cgstRate: number;
  sgstRate: number;
  igstRate: number;
  reverseCharge: boolean;
  challanNo: string | null;
  transportMode: string | null;
  vehicleNo: string | null;
  dateOfSupply: string | null;
  placeOfSupply: string | null;
  stateCode: string | null;
  company: InvoiceCompanyData | null;
  toCompany: InvoiceToCompanyData | null;
  billToCompany: InvoiceToCompanyData | null;
  shipToCompany: InvoiceToCompanyData | null;
  bankHolderName: string | null;
  bankAccountNumber: string | null;
  bankIfscCode: string | null;
  bankName: string | null;
  bankBranchName: string | null;
  billToName: string | null;
  billToAddress: string | null;
  billToGstin: string | null;
  billToEmail: string | null;
  billToState: string | null;
  billToStateCode: string | null;
  shipToName: string | null;
  shipToAddress: string | null;
  shipToGstin: string | null;
  shipToEmail: string | null;
  shipToState: string | null;
  shipToStateCode: string | null;
  termsAndConditions: string | null;
  logoUrl: string | null;
  phone: string | null;
  items: InvoiceItemData[];
}

function formatIndianCurrency(amount: number): string {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPlain(amount: number): string {
  return Number(amount).toFixed(2);
}

function formatRate(amount: number): string {
  const fixed = Number(amount).toFixed(1);
  if (fixed.endsWith(".0")) return fixed;
  return fixed;
}

function numberToWords(num: number): string {
  num = Number(num);
  if (num === 0) return "Zero";
  const ones = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ];
  const tens = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const convert = (n: number): string => {
    if (n < 20) return ones[n];
    if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : "");
    if (n < 1000)
      return ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " and " + convert(n % 100) : "");
    if (n < 100000)
      return (
        convert(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + convert(n % 1000) : "")
      );
    if (n < 10000000)
      return (
        convert(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + convert(n % 100000) : "")
      );
    return (
      convert(Math.floor(n / 10000000)) +
      " Crore" +
      (n % 10000000 ? " " + convert(n % 10000000) : "")
    );
  };

  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);
  let result = convert(rupees) + " Rupees";
  if (paise > 0) {
    result += " and " + convert(paise) + " Paise";
  }
  result += " Only";
  return result;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export interface InvoiceTemplateProps {
  invoice: InvoicePrintData;
}

const S = {
  border: "1px solid #999",
  borderLight: "1px solid #ccc",
  cell: "3px 4px",
  cellRight: "3px 6px",
  headerBg: "#dbeafe",
  bold: "font-weight: bold",
};

export function InvoiceTemplate({ invoice }: InvoiceTemplateProps) {
  const company = invoice.company;
  const billTo = invoice.billToCompany || invoice.toCompany;
  const shipTo = invoice.shipToCompany || invoice.toCompany;

  const resolvedBillTo = {
    name: invoice.billToName || billTo?.name,
    address: invoice.billToAddress || billTo?.address,
    gstNo: invoice.billToGstin || billTo?.gstNo,
    email: invoice.billToEmail || billTo?.email,
    state: invoice.billToState || billTo?.state,
    stateCode: invoice.billToStateCode || billTo?.stateCode,
  };

  const resolvedShipTo = {
    name: invoice.shipToName || shipTo?.name,
    address: invoice.shipToAddress || shipTo?.address,
    gstNo: invoice.shipToGstin || shipTo?.gstNo,
    email: invoice.shipToEmail || shipTo?.email,
    state: invoice.shipToState || shipTo?.state,
    stateCode: invoice.shipToStateCode || shipTo?.stateCode,
  };

  const resolvedBank = {
    holderName: invoice.bankHolderName || company?.bankHolderName || company?.name,
    accountNumber: invoice.bankAccountNumber || company?.bankAccountNumber,
    ifscCode: invoice.bankIfscCode || company?.bankIfscCode,
    name: invoice.bankName || company?.bankName,
    branchName: invoice.bankBranchName || company?.bankBranchName,
  };

  const termsList = useMemo(() => {
    if (invoice.termsAndConditions) {
      return invoice.termsAndConditions
        .split(/\r?\n/)
        .map((t) => t.trim())
        .filter((t) => t.length > 0);
    }
    return [
      "This is an electronically generated document.",
      "All disputes are subject to Chennai jurisdiction",
      "Warranty and claims of the products will be covered by respective",
      "Manufacturer/ service centers as per their terms and conditions",
      "Goods sold as bill prices are approved from customer end",
    ];
  }, [invoice.termsAndConditions]);

  const taxType = invoice.taxType;

  const totals = useMemo(() => {
    const subtotal = invoice.items.reduce((sum, item) => sum + Number(item.amount), 0);
    const totalQty = invoice.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    let cgstTotal = 0;
    let sgstTotal = 0;
    let igstTotal = 0;

    for (const item of invoice.items) {
      const itemTaxType: TaxType = item.gstType ? (item.gstType as TaxType) : taxType;
      if (itemTaxType === "CGST_SGST") {
        const cRate = item.cgstRate != null ? Number(item.cgstRate) : invoice.cgstRate;
        const sRate = item.sgstRate != null ? Number(item.sgstRate) : invoice.sgstRate;
        cgstTotal += (Number(item.amount) * cRate) / 100;
        sgstTotal += (Number(item.amount) * sRate) / 100;
      } else if (itemTaxType === "IGST") {
        const iRate = item.igstRate != null ? Number(item.igstRate) : invoice.igstRate;
        igstTotal += (Number(item.amount) * iRate) / 100;
      }
    }

    const taxTotal = cgstTotal + sgstTotal + igstTotal;
    const grandTotal = subtotal + taxTotal;
    const roundedTotal = Math.round(grandTotal);

    return {
      subtotal,
      totalQty,
      cgstTotal,
      sgstTotal,
      igstTotal,
      taxTotal,
      grandTotal: roundedTotal,
    };
  }, [invoice, taxType]);

  const isCGST = taxType === "CGST_SGST";
  const isIGST = taxType === "IGST";
  const isNoGST = taxType === "WITHOUT_GST";

  const hasCgstItems = invoice.items.some((it) => (it.gstType || taxType) === "CGST_SGST");
  const hasIgstItems = invoice.items.some((it) => (it.gstType || taxType) === "IGST");

  return (
    <div
      id="invoice-print"
      className="mx-auto bg-white text-black"
      style={{
        width: "100%",
        minHeight: "100%",
        // padding: "10mm 12mm",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "11px",
        lineHeight: "1.35",
        color: "#000",
      }}
    >
      {/* ═══════ Company Header ═══════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "2px" }}>
        <tbody>
          <tr>
            <td
              style={{
                width: "90px",
                verticalAlign: "top",
                textAlign: "center",
                padding: "0",
              }}
            >
              <div
                style={{
                  width: "80px",
                  height: "80px",
                  border: invoice.logoUrl ? "none" : "2px solid #d97706",
                  borderRadius: "4px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  marginTop: "-5px",
                  marginLeft: "5px",
                  overflow: "hidden",
                }}
              >
                {invoice.logoUrl ? (
                  <img
                    src={invoice.logoUrl}
                    alt="Company Logo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                ) : (
                  <>
                    <div
                      style={{
                        fontSize: "11px",
                        fontWeight: "bold",
                        color: "#d97706",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {company?.name?.substring(0, 10).toUpperCase() || "LOGO"}
                    </div>
                    <div
                      style={{
                        fontSize: "6px",
                        color: "#d97706",
                        fontStyle: "italic",
                        marginTop: "2px",
                      }}
                    >
                      always there...
                    </div>
                  </>
                )}
              </div>
            </td>
            <td style={{ verticalAlign: "top", textAlign: "center", padding: "0" }}>
              <div
                style={{
                  fontSize: "22px",
                  fontWeight: "bold",
                  letterSpacing: "2px",
                  color: "#000",
                }}
              >
                {company?.name || "COMPANY NAME"}
              </div>
              <div style={{ fontSize: "10px", marginTop: "1px", color: "#000" }}>
                {company?.address || "Company Address"}
              </div>
              {company?.email && (
                <div style={{ fontSize: "10px", color: "#000" }}>{company.email}</div>
              )}
              {company?.gstNo && (
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  GSTIN : {company.gstNo}
                </div>
              )}
              {company?.panNo && (
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#000" }}>
                  PAN No: {company.panNo}
                </div>
              )}
              {(invoice.phone || company?.phone) && (
                <div style={{ fontSize: "10px", color: "#000" }}>
                  LAND LINE : {invoice.phone || company?.phone}
                </div>
              )}
              {company?.website && (
                <div style={{ fontSize: "10px", color: "#000" }}>WEB SITE : {company.website}</div>
              )}
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════ TAX INVOICE Title ═══════ */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "4px" }}>
        <tbody>
          <tr>
            <td
              style={{
                border: "none",
                padding: "5px",
                textAlign: "center",
                fontSize: "16px",
                fontWeight: "bold",
                letterSpacing: "3px",
                background: "#dbeafe",
                color: "#000",
              }}
            >
              TAX INVOICE
            </td>
            <td
              style={{
                border: "none",
                padding: "3px 8px",
                verticalAlign: "middle",
                width: "200px",
                background: "#dbeafe",
                color: "#000",
                fontSize: "9px",
                lineHeight: "1.4",
              }}
            >
              <div>
                <span style={{ marginRight: "4px" }}>☑</span> Original for Recipient
              </div>
              <div>
                <span style={{ marginRight: "4px" }}>☐</span> Duplicate for Transporter
              </div>
              <div>
                <span style={{ marginRight: "4px" }}>☐</span> Triplicate for Supplier
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════ Invoice Info Grid ═══════ */}
      <table
        style={{
          width: "100%",
          border: S.border,
          borderCollapse: "collapse",
          marginTop: "-1px",
        }}
      >
        <thead>
          <tr>
            <th
              colSpan={2}
              style={{
                background: "#dbeafe",
                color: "#000",
                padding: "4px 8px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
                borderRight: S.border,
              }}
            >
              Details of Receiver | Billed to:
            </th>
            <th
              colSpan={2}
              style={{
                background: "#dbeafe",
                color: "#000",
                padding: "4px 8px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "4px 8px",
                borderRight: S.border,
                verticalAlign: "top",
                width: "50%",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0", width: "70px" }}>Name</td>
                    <td style={{ padding: "1px 0" }}>: {resolvedBillTo.name || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", verticalAlign: "top" }}>Address</td>
                    <td style={{ padding: "1px 0", whiteSpace: "pre-line" }}>
                      : {resolvedBillTo.address || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>GSTIN</td>
                    <td style={{ padding: "1px 0" }}>: {resolvedBillTo.gstNo || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>State</td>
                    <td style={{ padding: "1px 0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: 0 }}>: {resolvedBillTo.state || "—"}</td>
                            {resolvedBillTo.stateCode && (
                              <td
                                style={{ padding: 0, textAlign: "right", verticalAlign: "middle" }}
                              >
                                <span
                                  style={{
                                    border: "1px solid #000",
                                    padding: "1px 6px",
                                    fontSize: "9px",
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  State Code : {resolvedBillTo.stateCode}
                                </span>
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td
              colSpan={2}
              style={{
                padding: "4px 8px",
                verticalAlign: "top",
                width: "50%",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Invoice No.</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.invoiceNo || invoice.orderId}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Invoice Date</td>
                    <td style={{ padding: "1px 0" }}>: {formatDate(invoice.date)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>State</td>
                    <td style={{ padding: "1px 0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: 0 }}>: {company?.state || "—"}</td>
                            {company?.stateCode && (
                              <td
                                style={{ padding: 0, textAlign: "right", verticalAlign: "middle" }}
                              >
                                <span
                                  style={{
                                    border: "1px solid #000",
                                    padding: "1px 6px",
                                    fontSize: "9px",
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  State Code : {company.stateCode}
                                </span>
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      <table
        style={{
          width: "100%",
          border: S.border,
          borderTop: "none",
          borderCollapse: "collapse",
        }}
      >
        <thead>
          <tr>
            <th
              colSpan={2}
              style={{
                background: "#dbeafe",
                color: "#000",
                padding: "4px 8px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
                borderRight: S.border,
              }}
            >
              Details of Consigned | Shipped to:
            </th>
            <th
              colSpan={2}
              style={{
                background: "#dbeafe",
                color: "#000",
                padding: "4px 8px",
                textAlign: "center",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              &nbsp;
            </th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td
              colSpan={2}
              style={{
                padding: "4px 8px",
                borderRight: S.border,
                verticalAlign: "top",
                width: "50%",
              }}
            >
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0", width: "70px" }}>Name</td>
                    <td style={{ padding: "1px 0" }}>: {resolvedShipTo.name || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", verticalAlign: "top" }}>Address</td>
                    <td style={{ padding: "1px 0", whiteSpace: "pre-line" }}>
                      : {resolvedShipTo.address || "—"}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>GSTIN</td>
                    <td style={{ padding: "1px 0" }}>: {resolvedShipTo.gstNo || "—"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>State</td>
                    <td style={{ padding: "1px 0" }}>
                      <table style={{ width: "100%", borderCollapse: "collapse" }}>
                        <tbody>
                          <tr>
                            <td style={{ padding: 0 }}>: {resolvedShipTo.state || "—"}</td>
                            {resolvedShipTo.stateCode && (
                              <td
                                style={{ padding: 0, textAlign: "right", verticalAlign: "middle" }}
                              >
                                <span
                                  style={{
                                    border: "1px solid #000",
                                    padding: "1px 6px",
                                    fontSize: "9px",
                                    display: "inline-block",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  State Code : {resolvedShipTo.stateCode}
                                </span>
                              </td>
                            )}
                          </tr>
                        </tbody>
                      </table>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td colSpan={2} style={{ padding: "4px 8px", verticalAlign: "top", width: "50%" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0", width: "130px" }}>Challan No.</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.challanNo || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Transportation Mode</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.transportMode || "Road"}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Vehicle No.</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.vehicleNo || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Date of Supply</td>
                    <td style={{ padding: "1px 0" }}>: {formatDate(invoice.dateOfSupply)}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Place of Supply</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.placeOfSupply || ""}</td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0" }}>Reverse Charge</td>
                    <td style={{ padding: "1px 0" }}>: {invoice.reverseCharge ? "Yes" : "No"}</td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════ Product Table ═══════ */}
      <table
        style={{
          width: "100%",
          border: S.border,
          borderCollapse: "collapse",
          marginTop: "-1px",
        }}
      >
        <thead>
          <tr style={{ background: S.headerBg }}>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "center",
                fontSize: "9px",
                fontWeight: "bold",
                width: "30px",
                color: "#000",
              }}
            >
              Sr.
              <br />
              No.
            </th>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "left",
                fontSize: "9px",
                fontWeight: "bold",
                color: "#000",
              }}
            >
              Name of product
            </th>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "center",
                fontSize: "9px",
                fontWeight: "bold",
                width: "32px",
                color: "#000",
              }}
            >
              QTY
            </th>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "center",
                fontSize: "9px",
                fontWeight: "bold",
                width: "35px",
                color: "#000",
              }}
            >
              Unit
            </th>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "right",
                fontSize: "9px",
                fontWeight: "bold",
                width: "65px",
                color: "#000",
              }}
            >
              Rate
            </th>
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "right",
                fontSize: "9px",
                fontWeight: "bold",
                width: "80px",
                color: "#000",
              }}
            >
              Taxable
              <br />
              Value
            </th>
            {hasCgstItems && (
              <>
                <th
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  CGST
                </th>
                <th
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "center",
                    fontSize: "9px",
                    fontWeight: "bold",
                    color: "#000",
                  }}
                >
                  SGST
                </th>
              </>
            )}
            {hasIgstItems && (
              <th
                colSpan={2}
                style={{
                  border: S.border,
                  padding: S.cell,
                  textAlign: "center",
                  fontSize: "9px",
                  fontWeight: "bold",
                  color: "#000",
                }}
              >
                IGST
              </th>
            )}
            <th
              style={{
                border: S.border,
                padding: S.cell,
                textAlign: "right",
                fontSize: "9px",
                fontWeight: "bold",
                width: "80px",
                color: "#000",
              }}
            >
              Total
            </th>
          </tr>
          {(hasCgstItems || hasIgstItems) && (
            <tr style={{ background: S.headerBg }}>
              <th colSpan={6} style={{ border: S.border }} />
              {hasCgstItems && (
                <>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Amount
                  </th>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Amount
                  </th>
                </>
              )}
              {hasIgstItems && (
                <>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Rate
                  </th>
                  <th
                    style={{
                      border: S.border,
                      padding: "2px 3px",
                      textAlign: "center",
                      fontSize: "8px",
                      fontWeight: "bold",
                      color: "#000",
                    }}
                  >
                    Amount
                  </th>
                </>
              )}
              <th style={{ border: S.border }} />
            </tr>
          )}
        </thead>
        <tbody>
          {invoice.items.map((item, idx) => {
            const taxableValue = Number(item.amount);
            const itemTaxType: TaxType = item.gstType ? (item.gstType as TaxType) : taxType;
            const isCgstItem = itemTaxType === "CGST_SGST";
            const isIgstItem = itemTaxType === "IGST";
            const itemCgstRate = isCgstItem
              ? item.cgstRate != null
                ? Number(item.cgstRate)
                : invoice.cgstRate
              : 0;
            const itemSgstRate = isCgstItem
              ? item.sgstRate != null
                ? Number(item.sgstRate)
                : invoice.sgstRate
              : 0;
            const itemIgstRate = isIgstItem
              ? item.igstRate != null
                ? Number(item.igstRate)
                : invoice.igstRate
              : 0;
            const cgstAmt = (taxableValue * itemCgstRate) / 100;
            const sgstAmt = (taxableValue * itemSgstRate) / 100;
            const igstAmt = (taxableValue * itemIgstRate) / 100;
            const lineTotal = taxableValue + cgstAmt + sgstAmt + igstAmt;

            return (
              <tr key={item.id}>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "center",
                    fontSize: "10px",
                  }}
                >
                  {idx + 1}
                </td>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    fontSize: "10px",
                    textTransform: "uppercase",
                  }}
                >
                  {item.description || ""}
                </td>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "center",
                    fontSize: "10px",
                  }}
                >
                  {item.quantity}
                </td>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "center",
                    fontSize: "10px",
                  }}
                >
                  {item.per || item.unit || "QTL"}
                </td>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "right",
                    fontSize: "10px",
                  }}
                >
                  {formatRate(item.price)}
                </td>
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                    background: "#dbeafe",
                  }}
                >
                  {formatIndianCurrency(taxableValue)}
                </td>
                {hasCgstItems && hasIgstItems ? (
                  isCgstItem ? (
                    <>
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "9px",
                        }}
                      >{`${itemCgstRate.toFixed(2)}%`}</td>
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "10px",
                        }}
                      >
                        {formatPlain(cgstAmt)}
                      </td>
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "9px",
                        }}
                      >{`${itemSgstRate.toFixed(2)}%`}</td>
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "10px",
                        }}
                      >
                        {formatPlain(sgstAmt)}
                      </td>
                      <td
                        style={{ border: "none", padding: 0, background: "transparent" }}
                        colSpan={2}
                      />
                    </>
                  ) : isIgstItem ? (
                    <>
                      <td
                        style={{ border: "none", padding: 0, background: "transparent" }}
                        colSpan={4}
                      />
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "9px",
                        }}
                      >{`${itemIgstRate.toFixed(2)}%`}</td>
                      <td
                        style={{
                          border: S.border,
                          padding: S.cell,
                          textAlign: "right",
                          fontSize: "10px",
                        }}
                      >
                        {formatPlain(igstAmt)}
                      </td>
                    </>
                  ) : (
                    <td
                      style={{ border: "none", padding: 0, background: "transparent" }}
                      colSpan={6}
                    />
                  )
                ) : hasCgstItems ? (
                  <>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "9px",
                      }}
                    >{`${itemCgstRate.toFixed(2)}%`}</td>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "10px",
                      }}
                    >
                      {formatPlain(cgstAmt)}
                    </td>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "9px",
                      }}
                    >{`${itemSgstRate.toFixed(2)}%`}</td>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "10px",
                      }}
                    >
                      {formatPlain(sgstAmt)}
                    </td>
                  </>
                ) : hasIgstItems ? (
                  <>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "9px",
                      }}
                    >{`${itemIgstRate.toFixed(2)}%`}</td>
                    <td
                      style={{
                        border: S.border,
                        padding: S.cell,
                        textAlign: "right",
                        fontSize: "10px",
                      }}
                    >
                      {formatPlain(igstAmt)}
                    </td>
                  </>
                ) : null}
                <td
                  style={{
                    border: S.border,
                    padding: S.cell,
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {formatIndianCurrency(lineTotal)}
                </td>
              </tr>
            );
          })}
        </tbody>
        <tfoot>
          <tr style={{ fontWeight: "bold", background: S.headerBg, color: "#000" }}>
            <td
              colSpan={2}
              style={{ border: S.border, padding: "4px 6px", textAlign: "right", fontSize: "10px" }}
            >
              Total Quantity
            </td>
            <td
              style={{
                border: S.border,
                padding: "4px 3px",
                textAlign: "center",
                fontSize: "10px",
              }}
            >
              {totals.totalQty}
            </td>
            <td colSpan={2} style={{ border: S.border, padding: "4px 3px" }} />
            <td
              style={{
                border: S.border,
                padding: "4px 4px",
                textAlign: "right",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              ₹{formatIndianCurrency(totals.subtotal)}
            </td>
            {hasCgstItems && hasIgstItems ? (
              <>
                <td
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: "4px 4px",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {totals.cgstTotal > 0 ? `₹${formatIndianCurrency(totals.cgstTotal)}` : ""}
                </td>
                <td
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: "4px 4px",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {totals.sgstTotal > 0 ? `₹${formatIndianCurrency(totals.sgstTotal)}` : ""}
                </td>
                <td
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: "4px 4px",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  {totals.igstTotal > 0 ? `₹${formatIndianCurrency(totals.igstTotal)}` : ""}
                </td>
              </>
            ) : hasCgstItems ? (
              <>
                <td
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: "4px 4px",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  ₹{formatIndianCurrency(totals.cgstTotal)}
                </td>
                <td
                  colSpan={2}
                  style={{
                    border: S.border,
                    padding: "4px 4px",
                    textAlign: "right",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  ₹{formatIndianCurrency(totals.sgstTotal)}
                </td>
              </>
            ) : hasIgstItems ? (
              <td
                colSpan={2}
                style={{
                  border: S.border,
                  padding: "4px 4px",
                  textAlign: "right",
                  fontSize: "10px",
                  fontWeight: "bold",
                }}
              >
                ₹{formatIndianCurrency(totals.igstTotal)}
              </td>
            ) : null}
            <td
              style={{
                border: S.border,
                padding: "4px 4px",
                textAlign: "right",
                fontSize: "10px",
                fontWeight: "bold",
              }}
            >
              ₹{formatIndianCurrency(totals.grandTotal)}
            </td>
          </tr>
        </tfoot>
      </table>

      {/* ═══════ Tax Breakdown Table (left) + Before Tax + CGST/SGST (right) ═══════ */}
      <table
        style={{
          width: "100%",
          border: S.border,
          borderTop: "none",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "50%",
                padding: "6px 8px",
                borderRight: S.border,
                verticalAlign: "top",
              }}
            >
              {(() => {
                const rateMap = new Map<
                  number,
                  {
                    taxableValue: number;
                    cgstRate: number;
                    cgstAmount: number;
                    sgstRate: number;
                    sgstAmount: number;
                    igstRate: number;
                    igstAmount: number;
                  }
                >();

                for (const item of invoice.items) {
                  const itemTaxType: TaxType = item.gstType ? (item.gstType as TaxType) : taxType;
                  const taxableValue = Number(item.amount);

                  if (itemTaxType === "CGST_SGST") {
                    const cgstRate =
                      item.cgstRate != null ? Number(item.cgstRate) : invoice.cgstRate;
                    const sgstRate =
                      item.sgstRate != null ? Number(item.sgstRate) : invoice.sgstRate;
                    const gstRate = cgstRate + sgstRate;
                    const existing = rateMap.get(gstRate) || {
                      taxableValue: 0,
                      cgstRate,
                      cgstAmount: 0,
                      sgstRate,
                      sgstAmount: 0,
                      igstRate: 0,
                      igstAmount: 0,
                    };
                    existing.taxableValue += taxableValue;
                    existing.cgstAmount += (taxableValue * cgstRate) / 100;
                    existing.sgstAmount += (taxableValue * sgstRate) / 100;
                    rateMap.set(gstRate, existing);
                  } else if (itemTaxType === "IGST") {
                    const igstRate =
                      item.igstRate != null ? Number(item.igstRate) : invoice.igstRate;
                    const existing = rateMap.get(igstRate) || {
                      taxableValue: 0,
                      cgstRate: 0,
                      cgstAmount: 0,
                      sgstRate: 0,
                      sgstAmount: 0,
                      igstRate,
                      igstAmount: 0,
                    };
                    existing.taxableValue += taxableValue;
                    existing.igstAmount += (taxableValue * igstRate) / 100;
                    rateMap.set(igstRate, existing);
                  }
                }

                const rateRows = Array.from(rateMap.entries()).sort((a, b) => b[0] - a[0]);
                const hasCgst = rateRows.some(([, r]) => r.cgstRate > 0);
                const hasIgst = rateRows.some(([, r]) => r.igstRate > 0);

                const totalTaxable = rateRows.reduce((s, [, r]) => s + r.taxableValue, 0);
                const totalCgst = rateRows.reduce((s, [, r]) => s + r.cgstAmount, 0);
                const totalSgst = rateRows.reduce((s, [, r]) => s + r.sgstAmount, 0);
                const totalIgst = rateRows.reduce((s, [, r]) => s + r.igstAmount, 0);

                return (
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "9px" }}>
                    <thead>
                      <tr style={{ background: "#dbeafe" }}>
                        <th
                          style={{
                            border: S.border,
                            padding: "3px 4px",
                            textAlign: "center",
                            fontWeight: "bold",
                            fontSize: "9px",
                          }}
                        >
                          GST Rate
                        </th>
                        <th
                          style={{
                            border: S.border,
                            padding: "3px 4px",
                            textAlign: "right",
                            fontWeight: "bold",
                            fontSize: "9px",
                          }}
                        >
                          Taxable Value
                        </th>
                        {hasCgst && (
                          <th
                            colSpan={2}
                            style={{
                              border: S.border,
                              padding: "3px 4px",
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: "9px",
                            }}
                          >
                            CGST
                          </th>
                        )}
                        {hasCgst && (
                          <th
                            colSpan={2}
                            style={{
                              border: S.border,
                              padding: "3px 4px",
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: "9px",
                            }}
                          >
                            SGST
                          </th>
                        )}
                        {hasIgst && (
                          <th
                            colSpan={2}
                            style={{
                              border: S.border,
                              padding: "3px 4px",
                              textAlign: "center",
                              fontWeight: "bold",
                              fontSize: "9px",
                            }}
                          >
                            IGST
                          </th>
                        )}
                        <th
                          style={{
                            border: S.border,
                            padding: "3px 4px",
                            textAlign: "right",
                            fontWeight: "bold",
                            fontSize: "9px",
                          }}
                        >
                          Tax Amount
                        </th>
                      </tr>
                      {hasCgst && (
                        <tr style={{ background: "#dbeafe" }}>
                          <th style={{ border: S.border }} />
                          <th style={{ border: S.border }} />
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "center",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "right",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Amount
                          </th>
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "center",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "right",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Amount
                          </th>
                          <th style={{ border: S.border }} />
                        </tr>
                      )}
                      {hasIgst && !hasCgst && (
                        <tr style={{ background: "#dbeafe" }}>
                          <th style={{ border: S.border }} />
                          <th style={{ border: S.border }} />
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "center",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Rate
                          </th>
                          <th
                            style={{
                              border: S.border,
                              padding: "1px 2px",
                              textAlign: "right",
                              fontSize: "8px",
                              fontWeight: "bold",
                            }}
                          >
                            Amount
                          </th>
                          <th style={{ border: S.border }} />
                        </tr>
                      )}
                    </thead>
                    <tbody>
                      {rateRows.map(([gstRate, data]) => {
                        const totalTax = data.cgstAmount + data.sgstAmount + data.igstAmount;
                        return (
                          <tr key={gstRate}>
                            <td
                              style={{ border: S.border, padding: "3px 4px", textAlign: "center" }}
                            >
                              {gstRate.toFixed(2)}%
                            </td>
                            <td
                              style={{
                                border: S.border,
                                padding: "3px 4px",
                                textAlign: "right",
                                fontWeight: "bold",
                              }}
                            >
                              {formatIndianCurrency(data.taxableValue)}
                            </td>
                            {hasCgst && (
                              <>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "center",
                                  }}
                                >
                                  {data.cgstRate.toFixed(1)}%
                                </td>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "right",
                                  }}
                                >
                                  {formatPlain(data.cgstAmount)}
                                </td>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "center",
                                  }}
                                >
                                  {data.sgstRate.toFixed(1)}%
                                </td>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "right",
                                  }}
                                >
                                  {formatPlain(data.sgstAmount)}
                                </td>
                              </>
                            )}
                            {hasIgst && !hasCgst && (
                              <>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "center",
                                  }}
                                >
                                  {data.igstRate.toFixed(1)}%
                                </td>
                                <td
                                  style={{
                                    border: S.border,
                                    padding: "3px 4px",
                                    textAlign: "right",
                                  }}
                                >
                                  {formatPlain(data.igstAmount)}
                                </td>
                              </>
                            )}
                            <td
                              style={{
                                border: S.border,
                                padding: "3px 4px",
                                textAlign: "right",
                                fontWeight: "bold",
                              }}
                            >
                              {formatPlain(totalTax)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr style={{ fontWeight: "bold", background: "#dbeafe" }}>
                        <td style={{ border: S.border, padding: "3px 4px", textAlign: "center" }}>
                          Total
                        </td>
                        <td style={{ border: S.border, padding: "3px 4px", textAlign: "right" }}>
                          {formatIndianCurrency(totalTaxable)}
                        </td>
                        {hasCgst && (
                          <>
                            <td style={{ border: S.border }} />
                            <td
                              style={{ border: S.border, padding: "3px 4px", textAlign: "right" }}
                            >
                              {formatPlain(totalCgst)}
                            </td>
                            <td style={{ border: S.border }} />
                            <td
                              style={{ border: S.border, padding: "3px 4px", textAlign: "right" }}
                            >
                              {formatPlain(totalSgst)}
                            </td>
                          </>
                        )}
                        {hasIgst && !hasCgst && (
                          <>
                            <td style={{ border: S.border }} />
                            <td
                              style={{ border: S.border, padding: "3px 4px", textAlign: "right" }}
                            >
                              {formatPlain(totalIgst)}
                            </td>
                          </>
                        )}
                        <td style={{ border: S.border, padding: "3px 4px", textAlign: "right" }}>
                          {formatPlain(totalCgst + totalSgst + totalIgst)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                );
              })()}
            </td>
            <td style={{ width: "50%", padding: "0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td
                      style={{
                        padding: "3px 8px",
                        borderBottom: "1px solid #eee",
                        fontSize: "10px",
                      }}
                    >
                      Total Amount Before Tax
                    </td>
                    <td
                      style={{
                        padding: "3px 8px",
                        borderBottom: "1px solid #eee",
                        textAlign: "right",
                        fontSize: "10px",
                        fontWeight: "bold",
                      }}
                    >
                      : ₹{formatIndianCurrency(totals.subtotal)}
                    </td>
                  </tr>
                  {totals.cgstTotal > 0 && (
                    <>
                      <tr>
                        <td
                          style={{
                            padding: "3px 8px",
                            borderBottom: "1px solid #eee",
                            fontSize: "10px",
                          }}
                        >
                          Add : CGST
                        </td>
                        <td
                          style={{
                            padding: "3px 8px",
                            borderBottom: "1px solid #eee",
                            textAlign: "right",
                            fontSize: "10px",
                          }}
                        >
                          : ₹{formatIndianCurrency(totals.cgstTotal)}
                        </td>
                      </tr>
                      <tr>
                        <td
                          style={{
                            padding: "3px 8px",
                            borderBottom: "1px solid #eee",
                            fontSize: "10px",
                          }}
                        >
                          Add : SGST
                        </td>
                        <td
                          style={{
                            padding: "3px 8px",
                            borderBottom: "1px solid #eee",
                            textAlign: "right",
                            fontSize: "10px",
                          }}
                        >
                          : ₹{formatIndianCurrency(totals.sgstTotal)}
                        </td>
                      </tr>
                    </>
                  )}
                  {totals.igstTotal > 0 && (
                    <tr>
                      <td
                        style={{
                          padding: "3px 8px",
                          borderBottom: "1px solid #eee",
                          fontSize: "10px",
                        }}
                      >
                        Add : IGST
                      </td>
                      <td
                        style={{
                          padding: "3px 8px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                          fontSize: "10px",
                        }}
                      >
                        : ₹{formatIndianCurrency(totals.igstTotal)}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ═══════ Bank Details (left) + Tax + Grand Total (right) ═══════ */}
      <table
        style={{
          width: "100%",
          border: S.border,
          borderTop: "none",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "50%",
                padding: "6px 8px",
                borderRight: S.border,
                verticalAlign: "top",
              }}
            >
              <div
                style={{
                  fontWeight: "bold",
                  fontSize: "11px",
                  textAlign: "center",
                  marginBottom: "6px",
                  textDecoration: "underline",
                }}
              >
                Bank Details
              </div>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ padding: "1px 0", fontSize: "10px" }}>Account Holder Name :</td>
                    <td
                      style={{
                        padding: "1px 0",
                        fontSize: "10px",
                        textAlign: "right",
                        paddingRight: "10px",
                      }}
                    >
                      {resolvedBank.holderName}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", fontSize: "10px" }}>Bank Account Number :</td>
                    <td
                      style={{
                        padding: "1px 0",
                        fontSize: "10px",
                        textAlign: "right",
                        paddingRight: "10px",
                      }}
                    >
                      {resolvedBank.accountNumber}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", fontSize: "10px" }}>Bank IFSC Code :</td>
                    <td
                      style={{
                        padding: "1px 0",
                        fontSize: "10px",
                        textAlign: "right",
                        paddingRight: "10px",
                      }}
                    >
                      {resolvedBank.ifscCode}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", fontSize: "10px" }}>Bank Name :</td>
                    <td
                      style={{
                        padding: "1px 0",
                        fontSize: "10px",
                        textAlign: "right",
                        paddingRight: "10px",
                      }}
                    >
                      {resolvedBank.name}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: "1px 0", fontSize: "10px" }}>Bank Branch Name :</td>
                    <td
                      style={{
                        padding: "1px 0",
                        fontSize: "10px",
                        textAlign: "right",
                        paddingRight: "10px",
                      }}
                    >
                      {resolvedBank.branchName}
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
            <td style={{ width: "50%", padding: "0" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <tbody>
                  {!isNoGST && (
                    <tr>
                      <td
                        style={{
                          padding: "3px 8px",
                          borderBottom: "1px solid #eee",
                          fontSize: "10px",
                        }}
                      >
                        Tax Amount : GST
                      </td>
                      <td
                        style={{
                          padding: "3px 8px",
                          borderBottom: "1px solid #eee",
                          textAlign: "right",
                          fontSize: "10px",
                        }}
                      >
                        : ₹{formatIndianCurrency(totals.taxTotal)}
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: "4px 8px", fontSize: "11px", fontWeight: "bold" }}>
                      {isNoGST ? "Grand Total" : "Amount With Tax"}
                    </td>
                    <td
                      style={{
                        padding: "4px 8px",
                        textAlign: "right",
                        fontSize: "11px",
                        fontWeight: "bold",
                      }}
                    >
                      : ₹{formatIndianCurrency(totals.grandTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
              <div
                style={{
                  borderTop: "1px solid #eee",
                  margin: "0 8px",
                  paddingTop: "6px",
                  paddingBottom: "6px",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: "10px", marginBottom: "3px" }}>
                  Total Invoice Amount in words
                </div>
                <div style={{ fontSize: "10px" }}>{numberToWords(totals.grandTotal)}</div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
      <table
        style={{
          width: "100%",
          border: S.border,
          borderTop: "none",
          borderCollapse: "collapse",
        }}
      >
        <tbody>
          <tr>
            <td
              style={{
                width: "50%",
                padding: "6px 8px",
                borderRight: S.border,
                verticalAlign: "top",
              }}
            >
              <div style={{ fontWeight: "bold", fontSize: "11px", marginBottom: "4px" }}>
                Terms And Conditions
              </div>
              <ol
                style={{
                  margin: "0",
                  paddingLeft: "18px",
                  fontSize: "9px",
                  lineHeight: "1.5",
                }}
              >
                {termsList.map((term, idx) => (
                  <li key={idx}>{term}</li>
                ))}
              </ol>
            </td>
            <td
              style={{
                width: "50%",
                padding: "6px 8px",
                verticalAlign: "top",
              }}
            >
              <div style={{ fontSize: "10px", marginBottom: "4px", textAlign: "right" }}>
                Certified that the particular given above are true and correct
              </div>
              <div
                style={{
                  fontSize: "12px",
                  fontWeight: "bold",
                  marginTop: "20px",
                  textAlign: "right",
                }}
              >
                For, {company?.name || "COMPANY NAME"}
              </div>
              <div
                style={{
                  marginTop: "40px",
                  textAlign: "right",
                }}
              >
                <div
                  style={{
                    borderTop: "1px solid #333",
                    width: "150px",
                    display: "inline-block",
                    paddingTop: "4px",
                    fontSize: "10px",
                    textAlign: "center",
                  }}
                >
                  Authorised Signatory
                </div>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
