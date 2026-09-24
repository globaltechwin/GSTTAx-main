"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { InvoiceItem } from "@/lib/data";
import { cn } from "@/lib/utils";
import type { TaxType } from "@/components/invoice/invoice-template";
import {
  FileText,
  Plus,
  Trash2,
  Save,
  Printer,
  ArrowLeft,
  ChevronRight as BreadcrumbSep,
  ChevronDown,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import Link from "next/link";

interface FullCompany {
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

interface DropdownData {
  companies: FullCompany[];
  toCompanies: {
    id: number;
    name: string;
    gstNo: string | null;
    email: string | null;
    address: string | null;
    state: string | null;
    stateCode: string | null;
  }[];
  referrals: { id: number; name: string }[];
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export const DEFAULT_TERMS_TEXT = [
  "This is an electronically generated document.",
  "All disputes are subject to Chennai jurisdiction",
  "Warranty and claims of the products will be covered by respective",
  "Manufacturer/ service centers as per their terms and conditions",
  "Goods sold as bill prices are approved from customer end",
].join("\n");

function formatIndianCurrency(amount: number): string {
  return Number(amount).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatPlain(amount: number): string {
  return Number(amount).toFixed(2);
}

function numberToWords(num: number): string {
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

export function InvoiceForm({ invoiceId }: { invoiceId?: string }) {
  const router = useRouter();
  const [dropdownData, setDropdownData] = useState<DropdownData>({
    companies: [],
    toCompanies: [],
    referrals: [],
  });
  const [dropdownLoading, setDropdownLoading] = useState(true);
  const isEdit = !!invoiceId;

  const [companyId, setCompanyId] = useState("");
  const [toCompanyId, setToCompanyId] = useState("");
  const [billToCompanyId, setBillToCompanyId] = useState("");
  const [shipToCompanyId, setShipToCompanyId] = useState("");
  const [referral, setReferral] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [invoiceDate, setInvoiceDate] = useState(todayStr());

  const [taxType, setTaxType] = useState<TaxType>("CGST_SGST");
  const [cgstRate, setCgstRate] = useState("9");
  const [sgstRate, setSgstRate] = useState("9");
  const [igstRate, setIgstRate] = useState("18");
  const [taxTypeManuallySet, setTaxTypeManuallySet] = useState(false);

  const [reverseCharge, setReverseCharge] = useState(false);
  const [challanNo, setChallanNo] = useState("");
  const [transportMode, setTransportMode] = useState("Road");
  const [vehicleNo, setVehicleNo] = useState("");
  const [dateOfSupply, setDateOfSupply] = useState(todayStr());
  const [placeOfSupply, setPlaceOfSupply] = useState("");

  const [bankHolderName, setBankHolderName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
  const [bankIfscCode, setBankIfscCode] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankBranchName, setBankBranchName] = useState("");

  const [billToName, setBillToName] = useState("");
  const [billToAddress, setBillToAddress] = useState("");
  const [billToGstin, setBillToGstin] = useState("");
  const [billToEmail, setBillToEmail] = useState("");
  const [billToState, setBillToState] = useState("");
  const [billToStateCode, setBillToStateCode] = useState("");

  const [shipToName, setShipToName] = useState("");
  const [shipToAddress, setShipToAddress] = useState("");
  const [shipToGstin, setShipToGstin] = useState("");
  const [shipToEmail, setShipToEmail] = useState("");
  const [shipToState, setShipToState] = useState("");
  const [shipToStateCode, setShipToStateCode] = useState("");

  const [termsAndConditions, setTermsAndConditions] = useState(DEFAULT_TERMS_TEXT);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [phone, setPhone] = useState("");

  const [items, setItems] = useState<InvoiceItem[]>([
    { id: 1, description: "", hsn: "", sac: "", quantity: 0, price: 0, per: "Pcs", amount: 0, gstType: null, igstRate: null, cgstRate: null, sgstRate: null },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setDropdownLoading(true);
      try {
        const [dropdownRes, nextRes] = await Promise.all([
          fetch("/api/dropdown-data"),
          fetch("/api/invoices/next-number"),
        ]);
        if (dropdownRes.ok && !cancelled) {
          setDropdownData(await dropdownRes.json());
        }
        if (nextRes.ok && !cancelled) {
          const { nextInvoiceNo } = await nextRes.json();
          setInvoiceNo(nextInvoiceNo);
        }
      } catch {
      } finally {
        if (!cancelled) setDropdownLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isEdit || !invoiceId) return;
    let cancelled = false;
    async function loadInvoice() {
      setDropdownLoading(true);
      try {
        const res = await fetch(`/api/invoices/${invoiceId}`);
        if (!res.ok || cancelled) return;
        const inv = await res.json();
        if (cancelled) return;
        setCompanyId(inv.companyId ? String(inv.companyId) : "");
        setToCompanyId(inv.toCompanyId ? String(inv.toCompanyId) : "");
        setBillToCompanyId(inv.billToCompanyId ? String(inv.billToCompanyId) : "");
        setShipToCompanyId(inv.shipToCompanyId ? String(inv.shipToCompanyId) : "");
        setInvoiceNo(inv.invoiceNo || inv.orderId || "");
        setInvoiceDate(inv.date ? inv.date.split("T")[0] : todayStr());
        setTaxType(inv.taxType as TaxType);
        setCgstRate(String(inv.cgstRate ?? "9"));
        setSgstRate(String(inv.sgstRate ?? "9"));
        setIgstRate(String(inv.igstRate ?? "18"));
        setTaxTypeManuallySet(true);
        setReverseCharge(inv.reverseCharge ?? false);
        setChallanNo(inv.challanNo || "");
        setTransportMode(inv.transportMode || "Road");
        setVehicleNo(inv.vehicleNo || "");
        setDateOfSupply(inv.dateOfSupply ? inv.dateOfSupply.split("T")[0] : todayStr());
        setPlaceOfSupply(inv.placeOfSupply || "");
        setBankHolderName(inv.bankHolderName || "");
        setBankAccountNumber(inv.bankAccountNumber || "");
        setBankIfscCode(inv.bankIfscCode || "");
        setBankName(inv.bankName || "");
        setBankBranchName(inv.bankBranchName || "");
        setBillToName(inv.billToName || "");
        setBillToAddress(inv.billToAddress || "");
        setBillToGstin(inv.billToGstin || "");
        setBillToEmail(inv.billToEmail || "");
        setBillToState(inv.billToState || "");
        setBillToStateCode(inv.billToStateCode || "");
        setShipToName(inv.shipToName || "");
        setShipToAddress(inv.shipToAddress || "");
        setShipToGstin(inv.shipToGstin || "");
        setShipToEmail(inv.shipToEmail || "");
        setShipToState(inv.shipToState || "");
        setShipToStateCode(inv.shipToStateCode || "");
        setTermsAndConditions(inv.termsAndConditions || DEFAULT_TERMS_TEXT);
        setLogoUrl(inv.logoUrl || null);
        setPhone(inv.phone || "");
        if (inv.items && inv.items.length > 0) {
          setItems(
            inv.items.map((item: Record<string, unknown>, idx: number) => ({
              id: idx + 1,
              description: (item.description as string) || "",
              hsn: (item.hsn as string) || "",
              sac: (item.sac as string) || "",
              quantity: (item.quantity as number) || 0,
              price: Number(item.price) || 0,
              per: (item.per as string) || (item.unit as string) || "Pcs",
              amount: Number(item.amount) || 0,
              gstType: (item.gstType as string) || null,
              igstRate: item.igstRate != null ? Number(item.igstRate) : null,
              cgstRate: item.cgstRate != null ? Number(item.cgstRate) : null,
              sgstRate: item.sgstRate != null ? Number(item.sgstRate) : null,
            }))
          );
        }
      } catch {
      } finally {
        if (!cancelled) setDropdownLoading(false);
      }
    }
    loadInvoice();
    return () => { cancelled = true; };
  }, [isEdit, invoiceId]);

  const selectedCompany = useMemo(
    () => dropdownData.companies.find((c) => c.id === Number(companyId)),
    [dropdownData.companies, companyId]
  );

  const selectedToCompany = useMemo(
    () => dropdownData.toCompanies.find((c) => c.id === Number(toCompanyId)),
    [dropdownData.toCompanies, toCompanyId]
  );

  const autoDetectedTaxType: TaxType = useMemo(() => {
    if (selectedCompany?.state && selectedToCompany?.state) {
      return selectedCompany.state.toLowerCase() === selectedToCompany.state.toLowerCase()
        ? "CGST_SGST"
        : "IGST";
    }
    return "CGST_SGST";
  }, [selectedCompany, selectedToCompany]);

  const effectiveTaxType = taxTypeManuallySet ? taxType : autoDetectedTaxType;

  const handleTaxTypeChange = (val: TaxType) => {
    setTaxType(val);
    setTaxTypeManuallySet(true);
  };

  const addRow = () => {
    setItems((prev) => [
      ...prev,
      {
        id: Math.max(0, ...prev.map((i) => i.id)) + 1,
        description: "",
        hsn: "",
        sac: "",
        quantity: 0,
        price: 0,
        per: "Pcs",
        amount: 0,
        gstType: null,
        igstRate: null,
        cgstRate: null,
        sgstRate: null,
      },
    ]);
  };

  const deleteRow = (id: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const updateItem = (id: number, field: keyof InvoiceItem, value: string | number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        if (field === "quantity" || field === "price") {
          updated.amount = updated.quantity * updated.price;
        }
        return updated;
      })
    );
  };

  const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
  const isCGST = effectiveTaxType === "CGST_SGST";
  const isIGST = effectiveTaxType === "IGST";
  const isNoGST = effectiveTaxType === "WITHOUT_GST";

  const hasCgstItems = items.some((i) => (i.gstType || effectiveTaxType) === "CGST_SGST");
  const hasIgstItems = items.some((i) => (i.gstType || effectiveTaxType) === "IGST");
  const showCgstCols = hasCgstItems;
  const showIgstCols = hasIgstItems;

  const { cgstTotal, sgstTotal, igstTotal } = items.reduce(
    (acc, item) => {
      const t = item.gstType ? (item.gstType as TaxType) : effectiveTaxType;
      if (t === "CGST_SGST") {
        const fallbackCgst = parseFloat(cgstRate) || 0;
        const fallbackSgst = parseFloat(sgstRate) || 0;
        const cRate = item.cgstRate ?? fallbackCgst;
        const sRate = item.sgstRate ?? fallbackSgst;
        acc.cgstTotal += (item.amount * cRate) / 100;
        acc.sgstTotal += (item.amount * sRate) / 100;
      } else if (t === "IGST") {
        const fallbackIgst = parseFloat(igstRate) || 0;
        const iRate = item.igstRate ?? fallbackIgst;
        acc.igstTotal += (item.amount * iRate) / 100;
      }
      return acc;
    },
    { cgstTotal: 0, sgstTotal: 0, igstTotal: 0 }
  );
  const taxTotal = cgstTotal + sgstTotal + igstTotal;
  const grandTotal = subtotal + taxTotal;
  const roundedTotal = Math.round(grandTotal);
  const roundOff = roundedTotal - grandTotal;

  const buildInvoiceBody = () => {
    const totalRate = isCGST
      ? (parseFloat(cgstRate) || 0) + (parseFloat(sgstRate) || 0)
      : isIGST
        ? parseFloat(igstRate) || 0
        : 0;
    return {
      orderId: invoiceNo,
      companyId: companyId ? Number(companyId) : null,
      toCompanyId: toCompanyId ? Number(toCompanyId) : null,
      billToCompanyId: billToCompanyId ? Number(billToCompanyId) : toCompanyId ? Number(toCompanyId) : null,
      shipToCompanyId: shipToCompanyId ? Number(shipToCompanyId) : toCompanyId ? Number(toCompanyId) : null,
      email: selectedToCompany?.email || "",
      gst: totalRate > 0 ? `${totalRate}%` : "",
      amount: subtotal,
      total: roundedTotal,
      date: invoiceDate,
      taxType: effectiveTaxType,
      cgstRate: isCGST ? parseFloat(cgstRate) || 0 : 0,
      sgstRate: isCGST ? parseFloat(sgstRate) || 0 : 0,
      igstRate: isIGST ? parseFloat(igstRate) || 0 : 0,
      reverseCharge,
      invoiceNo,
      challanNo,
      transportMode,
      vehicleNo,
      dateOfSupply,
      placeOfSupply,
      stateCode: selectedCompany?.stateCode || "",
      bankHolderName,
      bankAccountNumber,
      bankIfscCode,
      bankName,
      bankBranchName,
      billToName,
      billToAddress,
      billToGstin,
      billToEmail,
      billToState,
      billToStateCode,
      shipToName,
      shipToAddress,
      shipToGstin,
      shipToEmail,
      shipToState,
      shipToStateCode,
      termsAndConditions,
      logoUrl,
      phone,
      items: items.map((item) => {
        const itemTaxType: TaxType = item.gstType
          ? (item.gstType as TaxType)
          : effectiveTaxType;
        const fallbackIgst = parseFloat(igstRate) || 0;
        const fallbackCgst = parseFloat(cgstRate) || 0;
        const fallbackSgst = parseFloat(sgstRate) || 0;
        return {
          description: item.description,
          hsn: item.hsn,
          sac: item.sac,
          quantity: item.quantity,
          unit: item.per,
          price: item.price,
          per: item.per,
          amount: item.amount,
          gstType: item.gstType || null,
          igstRate: item.igstRate ?? (itemTaxType === "IGST" ? fallbackIgst : null),
          cgstRate: item.cgstRate ?? (itemTaxType === "CGST_SGST" ? fallbackCgst : null),
          sgstRate: item.sgstRate ?? (itemTaxType === "CGST_SGST" ? fallbackSgst : null),
        };
      }),
    };
  };

  const postInvoice = async (body: ReturnType<typeof buildInvoiceBody>) => {
    const res = await fetch(isEdit ? `/api/invoices/${invoiceId}` : "/api/invoices", {
      method: isEdit ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return res;
  };

  const handleSubmit = async () => {
    if (!companyId) {
      setSubmitError("Please select a company");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const body = buildInvoiceBody();
      const res = await postInvoice(body);
      if (res.ok) {
        const created = await res.json();
        router.push(`/dashboard/invoices/${isEdit ? invoiceId : created.id}`);
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to create invoice");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveAndPrint = async () => {
    if (!companyId) {
      setSubmitError("Please select a company");
      return;
    }
    setSubmitError(null);
    setSubmitting(true);
    try {
      const body = buildInvoiceBody();
      const res = await postInvoice(body);
      if (res.ok) {
        const created = await res.json();
        const id = isEdit ? invoiceId : created.id;
        window.open(`/dashboard/invoices/${id}`, "_blank");
      } else {
        const err = await res.json();
        setSubmitError(err.error || "Failed to create invoice");
      }
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const taxTypeOptions: { value: TaxType; label: string }[] = [
    { value: "CGST_SGST", label: "CGST + SGST" },
    { value: "IGST", label: "IGST" },
    { value: "WITHOUT_GST", label: "Without GST" },
  ];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <nav className="text-muted-foreground flex items-center gap-1.5 text-sm">
        <Link href="/dashboard" className="hover:text-foreground transition-colors">
          Home
        </Link>
        <BreadcrumbSep className="size-3.5" />
        <Link href="/dashboard/invoices" className="hover:text-foreground transition-colors">
          Invoices
        </Link>
        <BreadcrumbSep className="size-3.5" />
        <span className="text-foreground font-medium">Add Invoice</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/invoices"
            className="border-border/60 text-muted-foreground hover:bg-muted/50 hover:text-foreground inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-medium transition-all"
          >
            <ArrowLeft className="size-4" />
            Back
          </Link>
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 flex size-11 items-center justify-center rounded-xl">
              <FileText className="text-primary size-5" />
            </div>
            <div>
              <h1 className="text-foreground text-xl font-bold tracking-tight">
                {isEdit ? "Edit Invoice" : "Add New Invoice"}
              </h1>
              <p className="text-muted-foreground mt-0.5 text-sm">
                Create a new invoice for your customer
              </p>
            </div>
          </div>
        </div>
      </div>

      {submitError && (
        <div className="flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="size-4 shrink-0" />
          {submitError}
        </div>
      )}

      {/* Invoice Details */}
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground mb-6 text-lg font-semibold">Invoice Details</h2>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyId" className="text-sm font-medium">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <select
                  id="companyId"
                  value={companyId}
                  onChange={(e) => setCompanyId(e.target.value)}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">{dropdownLoading ? "Loading..." : "Select Company"}</option>
                  {dropdownData.companies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
              {selectedCompany?.state && (
                <p className="text-muted-foreground text-xs">
                  State: {selectedCompany.state}
                  {selectedCompany.stateCode && ` (${selectedCompany.stateCode})`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="toCompanyId" className="text-sm font-medium">
                TO <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <select
                  id="toCompanyId"
                  value={toCompanyId}
                  onChange={(e) => setToCompanyId(e.target.value)}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">{dropdownLoading ? "Loading..." : "Select To Company"}</option>
                  {dropdownData.toCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
              {selectedToCompany?.state && (
                <p className="text-muted-foreground text-xs">
                  State: {selectedToCompany.state}
                  {selectedToCompany.stateCode && ` (${selectedToCompany.stateCode})`}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="billToCompanyId" className="text-sm font-medium">
                Bill To
              </Label>
              <div className="relative">
                <select
                  id="billToCompanyId"
                  value={billToCompanyId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setBillToCompanyId(val);
                    const c = dropdownData.toCompanies.find((x) => x.id === Number(val));
                    setBillToName(c?.name || "");
                    setBillToAddress(c?.address || "");
                    setBillToGstin(c?.gstNo || "");
                    setBillToEmail(c?.email || "");
                    setBillToState(c?.state || "");
                    setBillToStateCode(c?.stateCode || "");
                  }}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">{dropdownLoading ? "Loading..." : "Select Bill To Company"}</option>
                  {dropdownData.toCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="shipToCompanyId" className="text-sm font-medium">
                Ship To
              </Label>
              <div className="relative">
                <select
                  id="shipToCompanyId"
                  value={shipToCompanyId}
                  onChange={(e) => {
                    const val = e.target.value;
                    setShipToCompanyId(val);
                    const c = dropdownData.toCompanies.find((x) => x.id === Number(val));
                    setShipToName(c?.name || "");
                    setShipToAddress(c?.address || "");
                    setShipToGstin(c?.gstNo || "");
                    setShipToEmail(c?.email || "");
                    setShipToState(c?.state || "");
                    setShipToStateCode(c?.stateCode || "");
                  }}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">{dropdownLoading ? "Loading..." : "Select Ship To Company"}</option>
                  {dropdownData.toCompanies.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tax Type</Label>
              <div className="flex gap-2">
                {taxTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleTaxTypeChange(opt.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-sm font-medium transition-all",
                      effectiveTaxType === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border/60 text-muted-foreground hover:bg-muted/50"
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              {!taxTypeManuallySet && selectedCompany?.state && selectedToCompany?.state && (
                <p className="text-muted-foreground text-xs italic">
                  Auto-detected:{" "}
                  {selectedCompany.state === selectedToCompany.state
                    ? "Same state → CGST+SGST"
                    : "Different state → IGST"}
                </p>
              )}
              {/* Inline rate inputs */}
              {isCGST && (
                <div className="flex gap-3">
                  <div className="flex items-center gap-1.5">
                    <Label className="text-muted-foreground text-xs">CGST %</Label>
                    <Input
                      type="number"
                      value={cgstRate}
                      onChange={(e) => setCgstRate(e.target.value)}
                      className="h-8 w-16 text-center text-xs"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Label className="text-muted-foreground text-xs">SGST %</Label>
                    <Input
                      type="number"
                      value={sgstRate}
                      onChange={(e) => setSgstRate(e.target.value)}
                      className="h-8 w-16 text-center text-xs"
                      min={0}
                      max={100}
                      step={0.1}
                    />
                  </div>
                </div>
              )}
              {isIGST && (
                <div className="flex items-center gap-1.5">
                  <Label className="text-muted-foreground text-xs">IGST %</Label>
                  <Input
                    type="number"
                    value={igstRate}
                    onChange={(e) => setIgstRate(e.target.value)}
                    className="h-8 w-16 text-center text-xs"
                    min={0}
                    max={100}
                    step={0.1}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="referral" className="text-sm font-medium">
                Referral
              </Label>
              <div className="relative">
                <select
                  id="referral"
                  value={referral}
                  onChange={(e) => setReferral(e.target.value)}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="">{dropdownLoading ? "Loading..." : "Select Referral"}</option>
                  {dropdownData.referrals.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.name}
                    </option>
                  ))}
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceNo" className="text-sm font-medium">
                Invoice No
              </Label>
              <Input
                id="invoiceNo"
                value={invoiceNo}
                onChange={(e) => setInvoiceNo(e.target.value)}
                placeholder="e.g. 33"
                className="font-mono"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invoiceDate" className="text-sm font-medium">
                Invoice Date
              </Label>
              <Input
                id="invoiceDate"
                type="date"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="text-sm font-medium">
                Landline / Phone
              </Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 044-12345678"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Company Logo</Label>
              <div
                onDragOver={(e) => { e.preventDefault(); e.stopPropagation(); }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  const file = e.dataTransfer.files?.[0];
                  if (file && file.type.startsWith("image/")) {
                    const reader = new FileReader();
                    reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
                    reader.readAsDataURL(file);
                  }
                }}
                className="border-border/60 bg-muted/20 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-3 transition-colors hover:border-primary/50 hover:bg-primary/5"
                onClick={() => document.getElementById("logo-upload")?.click()}
              >
                {logoUrl ? (
                  <div className="relative flex w-full items-center gap-3">
                    <img
                      src={logoUrl}
                      alt="Logo preview"
                      className="size-12 rounded border object-contain"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-foreground truncate text-xs font-medium">Logo uploaded</p>
                      <p className="text-muted-foreground text-xs">Click or drop to replace</p>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setLogoUrl(null);
                      }}
                      className="text-muted-foreground hover:text-destructive text-xs"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-muted-foreground text-xs">
                      Drag & drop or click to upload
                    </p>
                    <p className="text-muted-foreground/60 mt-1 text-xs">PNG, JPG up to 2MB</p>
                  </>
                )}
                <input
                  id="logo-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => setLogoUrl(ev.target?.result as string);
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transport Details */}
        <div className="mt-6 border-t pt-6">
          <h3 className="text-foreground mb-4 text-sm font-semibold">Transport Details</h3>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Reverse Charge</Label>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={reverseCharge}
                  onChange={(e) => setReverseCharge(e.target.checked)}
                  className="size-4"
                />
                <span className="text-muted-foreground text-sm">Applicable</span>
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Challan No</Label>
              <Input
                value={challanNo}
                onChange={(e) => setChallanNo(e.target.value)}
                placeholder="Enter challan number"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Transport Mode</Label>
              <div className="relative">
                <select
                  value={transportMode}
                  onChange={(e) => setTransportMode(e.target.value)}
                  className="border-border/60 bg-card focus:ring-primary/20 h-10 w-full appearance-none rounded-lg border py-2 pr-8 pl-3 text-sm focus:ring-2 focus:outline-none"
                >
                  <option value="Road">Road</option>
                  <option value="Rail">Rail</option>
                  <option value="Air">Air</option>
                  <option value="Sea">Sea</option>
                </select>
                <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Vehicle No</Label>
              <Input
                value={vehicleNo}
                onChange={(e) => setVehicleNo(e.target.value)}
                placeholder="Enter vehicle number"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Date of Supply</Label>
              <Input
                type="date"
                value={dateOfSupply}
                onChange={(e) => setDateOfSupply(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Place of Supply</Label>
              <Input
                value={placeOfSupply}
                onChange={(e) => setPlaceOfSupply(e.target.value)}
                placeholder="Enter place of supply"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Billed To / Shipped To Details Override */}
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground mb-1 text-lg font-semibold">
          Billed To / Shipped To Details
        </h2>
        <p className="text-muted-foreground mb-4 text-xs">
          These override the selected companies on the invoice. Leave blank to use the company
          details.
        </p>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <h3 className="text-foreground text-sm font-semibold">Billed To</h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={billToName}
                onChange={(e) => setBillToName(e.target.value)}
                placeholder="Receiver name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <textarea
                value={billToAddress}
                onChange={(e) => setBillToAddress(e.target.value)}
                placeholder="Receiver address"
                rows={3}
                className="border-border/60 bg-card focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">GSTIN</Label>
                <Input
                  value={billToGstin}
                  onChange={(e) => setBillToGstin(e.target.value)}
                  placeholder="GSTIN"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  value={billToEmail}
                  onChange={(e) => setBillToEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">State</Label>
                <Input
                  value={billToState}
                  onChange={(e) => setBillToState(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">State Code</Label>
                <Input
                  value={billToStateCode}
                  onChange={(e) => setBillToStateCode(e.target.value)}
                  placeholder="e.g. 33"
                />
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <h3 className="text-foreground text-sm font-semibold">Shipped To</h3>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Name</Label>
              <Input
                value={shipToName}
                onChange={(e) => setShipToName(e.target.value)}
                placeholder="Consignee name"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Address</Label>
              <textarea
                value={shipToAddress}
                onChange={(e) => setShipToAddress(e.target.value)}
                placeholder="Consignee address"
                rows={3}
                className="border-border/60 bg-card focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">GSTIN</Label>
                <Input
                  value={shipToGstin}
                  onChange={(e) => setShipToGstin(e.target.value)}
                  placeholder="GSTIN"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Email</Label>
                <Input
                  value={shipToEmail}
                  onChange={(e) => setShipToEmail(e.target.value)}
                  placeholder="Email"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">State</Label>
                <Input
                  value={shipToState}
                  onChange={(e) => setShipToState(e.target.value)}
                  placeholder="State"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">State Code</Label>
                <Input
                  value={shipToStateCode}
                  onChange={(e) => setShipToStateCode(e.target.value)}
                  placeholder="e.g. 33"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bank Details Override */}
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground mb-1 text-lg font-semibold">Bank Details</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          These override the company bank details on the invoice. Leave blank to use the company
          details.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Account Holder Name</Label>
            <Input
              value={bankHolderName}
              onChange={(e) => setBankHolderName(e.target.value)}
              placeholder="Account holder name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bank Account Number</Label>
            <Input
              value={bankAccountNumber}
              onChange={(e) => setBankAccountNumber(e.target.value)}
              placeholder="Account number"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bank IFSC Code</Label>
            <Input
              value={bankIfscCode}
              onChange={(e) => setBankIfscCode(e.target.value)}
              placeholder="IFSC code"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bank Name</Label>
            <Input
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              placeholder="Bank name"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bank Branch Name</Label>
            <Input
              value={bankBranchName}
              onChange={(e) => setBankBranchName(e.target.value)}
              placeholder="Branch name"
            />
          </div>
        </div>
      </div>

      {/* Terms & Conditions */}
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <h2 className="text-foreground mb-1 text-lg font-semibold">Terms & Conditions</h2>
        <p className="text-muted-foreground mb-4 text-xs">
          One condition per line. The defaults are prefilled and can be edited.
        </p>
        <textarea
          value={termsAndConditions}
          onChange={(e) => setTermsAndConditions(e.target.value)}
          rows={6}
          className="border-border/60 bg-card focus:ring-primary/20 w-full rounded-lg border px-3 py-2 text-sm focus:ring-2 focus:outline-none"
        />
      </div>

      {/* Order Summary */}
      <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-foreground text-lg font-semibold">Order Summary</h2>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (items.length <= 1) return;
                setItems((prev) => prev.slice(0, -1));
              }}
              disabled={items.length <= 1}
              className="border-red-500/30 bg-red-500/10 text-red-600 hover:bg-red-500/20"
            >
              <Trash2 className="size-4" />
              Delete
            </Button>
            <Button
              type="button"
              onClick={addRow}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              <Plus className="size-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Items Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-border/60 bg-muted/30 border-b">
                <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">Sr.<br/>No.</th>
                <th className="text-muted-foreground px-2 py-2 text-left text-[10px] font-semibold tracking-wider uppercase">Name of product</th>
                <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">QTY</th>
                <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">Unit</th>
                <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">Rate</th>
                <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">Taxable<br/>Value</th>
                <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">GST<br/>Type</th>
                {showCgstCols && (
                  <>
                    <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">CGST<br/>Rate</th>
                    <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">CGST<br/>Amt</th>
                    <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">SGST<br/>Rate</th>
                    <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">SGST<br/>Amt</th>
                  </>
                )}
                {showIgstCols && (
                  <>
                    <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">IGST<br/>Rate</th>
                    <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">IGST<br/>Amt</th>
                  </>
                )}
                <th className="text-muted-foreground px-2 py-2 text-right text-[10px] font-semibold tracking-wider uppercase">Total</th>
                <th className="text-muted-foreground px-2 py-2 text-center text-[10px] font-semibold tracking-wider uppercase">Option</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item, index) => {
                const taxableValue = item.amount;
                const itemTaxType: TaxType = item.gstType ? (item.gstType as TaxType) : effectiveTaxType;
                const fallbackCgst = parseFloat(cgstRate) || 0;
                const fallbackSgst = parseFloat(sgstRate) || 0;
                const fallbackIgst = parseFloat(igstRate) || 0;
                const itemCgstRate = itemTaxType === "CGST_SGST" ? (item.cgstRate ?? fallbackCgst) : 0;
                const itemSgstRate = itemTaxType === "CGST_SGST" ? (item.sgstRate ?? fallbackSgst) : 0;
                const itemIgstRate = itemTaxType === "IGST" ? (item.igstRate ?? fallbackIgst) : 0;
                const cgstAmt = (taxableValue * itemCgstRate) / 100;
                const sgstAmt = (taxableValue * itemSgstRate) / 100;
                const igstAmt = (taxableValue * itemIgstRate) / 100;
                const lineTotal = taxableValue + cgstAmt + sgstAmt + igstAmt;
                const isCgstItem = itemTaxType === "CGST_SGST";
                const isIgstItem = itemTaxType === "IGST";

                return (
                  <tr key={item.id} className="border-border/40 hover:bg-muted/20 border-b transition-colors">
                    <td className="px-2 py-2 text-center text-sm font-medium">{index + 1}</td>
                    <td className="px-2 py-2">
                      <Input value={item.description} onChange={(e) => updateItem(item.id, "description", e.target.value)} placeholder="Name of product" className="h-8 text-sm" />
                    </td>
                    <td className="px-2 py-2">
                      <Input type="number" value={item.quantity || ""} onChange={(e) => updateItem(item.id, "quantity", parseFloat(e.target.value) || 0)} placeholder="0" className="h-8 w-16 text-center text-sm" min={0} />
                    </td>
                    <td className="px-2 py-2">
                      <div className="relative">
                        <select value={item.per} onChange={(e) => updateItem(item.id, "per", e.target.value)} className="border-border/60 bg-card focus:ring-primary/20 h-8 w-16 appearance-none rounded-lg border py-1 pr-5 pl-1 text-center text-sm focus:ring-2 focus:outline-none">
                          <option value="Pcs">Pcs</option>
                          <option value="QTL">QTL</option>
                          <option value="Kg">Kg</option>
                          <option value="Ltr">Ltr</option>
                          <option value="Mtr">Mtr</option>
                          <option value="Box">Box</option>
                          <option value="Set">Set</option>
                        </select>
                        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-1 size-3 -translate-y-1/2" />
                      </div>
                    </td>
                    <td className="px-2 py-2">
                      <Input type="number" value={item.price || ""} onChange={(e) => updateItem(item.id, "price", parseFloat(e.target.value) || 0)} placeholder="0.00" className="h-8 w-24 text-right text-sm" min={0} step={0.01} />
                    </td>
                    <td className="px-2 py-2 text-right text-sm font-semibold">{formatIndianCurrency(taxableValue)}</td>
                    <td className="px-2 py-2">
                      <div className="relative">
                        <select value={item.gstType || ""} onChange={(e) => { const val = e.target.value as string; updateItem(item.id, "gstType", val); if (val === "CGST_SGST") { if (item.cgstRate == null) updateItem(item.id, "cgstRate", parseFloat(cgstRate) || 9); if (item.sgstRate == null) updateItem(item.id, "sgstRate", parseFloat(sgstRate) || 9); } else if (val === "IGST") { if (item.igstRate == null) updateItem(item.id, "igstRate", parseFloat(igstRate) || 18); } }} className="border-border/60 bg-card focus:ring-primary/20 h-8 w-20 appearance-none rounded-lg border py-1 pr-4 pl-1 text-center text-[11px] font-medium focus:ring-2 focus:outline-none">
                          <option value="">Inherit</option>
                          <option value="CGST_SGST">CGST+SGST</option>
                          <option value="IGST">IGST</option>
                          <option value="WITHOUT_GST">None</option>
                        </select>
                        <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-1 size-3 -translate-y-1/2" />
                      </div>
                    </td>
                    {showCgstCols && showIgstCols ? (
                      isCgstItem ? (
                        <>
                          <td className="px-2 py-1.5">
                            <Input type="number" value={itemCgstRate || ""} onChange={(e) => updateItem(item.id, "cgstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                          </td>
                          <td className="px-2 py-2 text-right text-sm">{formatPlain(cgstAmt)}</td>
                          <td className="px-2 py-1.5">
                            <Input type="number" value={itemSgstRate || ""} onChange={(e) => updateItem(item.id, "sgstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                          </td>
                          <td className="px-2 py-2 text-right text-sm">{formatPlain(sgstAmt)}</td>
                          <td colSpan={2} style={{ padding: 0, border: "none", background: "transparent" }} />
                        </>
                      ) : isIgstItem ? (
                        <>
                          <td colSpan={4} style={{ padding: 0, border: "none", background: "transparent" }} />
                          <td className="px-2 py-1.5">
                            <Input type="number" value={itemIgstRate || ""} onChange={(e) => updateItem(item.id, "igstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                          </td>
                          <td className="px-2 py-2 text-right text-sm">{formatPlain(igstAmt)}</td>
                        </>
                      ) : (
                        <td colSpan={6} style={{ padding: 0, border: "none", background: "transparent" }} />
                      )
                    ) : showCgstCols ? (
                      <>
                        <td className="px-2 py-1.5">
                          <Input type="number" value={itemCgstRate || ""} onChange={(e) => updateItem(item.id, "cgstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                        </td>
                        <td className="px-2 py-2 text-right text-sm">{formatPlain(cgstAmt)}</td>
                        <td className="px-2 py-1.5">
                          <Input type="number" value={itemSgstRate || ""} onChange={(e) => updateItem(item.id, "sgstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                        </td>
                        <td className="px-2 py-2 text-right text-sm">{formatPlain(sgstAmt)}</td>
                      </>
                    ) : showIgstCols ? (
                      <>
                        <td className="px-2 py-1.5">
                          <Input type="number" value={itemIgstRate || ""} onChange={(e) => updateItem(item.id, "igstRate", parseFloat(e.target.value) || 0)} className="h-7 w-14 text-center text-[11px]" min={0} max={100} step={0.1} />
                        </td>
                        <td className="px-2 py-2 text-right text-sm">{formatPlain(igstAmt)}</td>
                      </>
                    ) : null}
                    <td className="px-2 py-2 text-right text-sm font-bold">{formatIndianCurrency(lineTotal)}</td>
                    <td className="px-2 py-2 text-center">
                      <button onClick={() => deleteRow(item.id)} disabled={items.length <= 1} className="inline-flex items-center gap-1 rounded-lg bg-red-500/10 p-1.5 text-red-600 transition-colors hover:bg-red-500/20 disabled:cursor-not-allowed disabled:opacity-30" title="Delete row">
                        <Trash2 className="size-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Left: Amount in words */}
        <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Total Quantity:</Label>
              <span className="text-foreground text-sm font-semibold">
                {items.reduce((sum, item) => sum + item.quantity, 0)}
              </span>
            </div>
            <div className="space-y-2">
              <Label className="text-sm font-medium">Total Amount In Words:</Label>
              <div className="border-border/60 bg-muted/30 w-full rounded-lg border px-3 py-2 text-sm">
                {numberToWords(roundedTotal)}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Totals */}
        <div className="border-border/60 bg-card rounded-2xl border p-6 shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Total Amount Before Tax:</Label>
              <span className="text-foreground text-sm font-semibold">
                ₹{subtotal > 0 ? formatIndianCurrency(subtotal) : "0.00"}
              </span>
            </div>

            {cgstTotal > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-blue-600">Add : CGST:</Label>
                <span className="text-foreground text-sm">
                  ₹{formatIndianCurrency(cgstTotal)}
                </span>
              </div>
            )}

            {sgstTotal > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-blue-600">Add : SGST:</Label>
                <span className="text-foreground text-sm">
                  ₹{formatIndianCurrency(sgstTotal)}
                </span>
              </div>
            )}

            {igstTotal > 0 && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-blue-600">Add : IGST:</Label>
                <span className="text-foreground text-sm">
                  ₹{formatIndianCurrency(igstTotal)}
                </span>
              </div>
            )}

            {!isNoGST && (
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Tax Amount : GST:</Label>
                <span className="text-foreground text-sm font-semibold">
                  ₹{taxTotal > 0 ? formatIndianCurrency(taxTotal) : "0.00"}
                </span>
              </div>
            )}

            <div className="border-border/60 border-t pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold">
                  {isNoGST ? "Grand Total:" : "Amount With Tax:"}
                </Label>
                <span className="bg-primary/5 text-primary rounded-lg px-3 py-1 text-sm font-bold">
                  ₹{roundedTotal > 0 ? formatIndianCurrency(roundedTotal) : "0.00"}
                </span>
              </div>
              {roundOff !== 0 && (
                <div className="mt-1 flex items-center justify-between">
                  <span className="text-muted-foreground text-xs">Round Off:</span>
                  <span className="text-muted-foreground text-xs">
                    ₹{formatIndianCurrency(roundOff)}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-border/60 bg-card flex items-center justify-end gap-3 rounded-2xl border p-4 shadow-sm">
        <Link href="/dashboard/invoices">
          <Button type="button" variant="outline">
            Cancel
          </Button>
        </Link>
        <Button
          type="button"
          variant="outline"
          onClick={handleSaveAndPrint}
          disabled={submitting}
        >
          <Printer className="size-4" />
          Save & Print
        </Button>
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="bg-green-600 text-white hover:bg-green-700"
        >
          {submitting ? <RefreshCw className="size-4 animate-spin" /> : <Save className="size-4" />}
          {submitting ? "Submitting..." : isEdit ? "Update" : "Submit"}
        </Button>
      </div>
    </div>
  );
}
