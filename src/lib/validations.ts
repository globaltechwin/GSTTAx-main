import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name is too long"),
  gstNo: z.string().optional(),
  state: z.string().max(50).optional(),
  stateCode: z.string().max(5).optional(),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address"),
  date: z.string().min(1, "Date is required"),
  status: z.enum(["active", "inactive", "pending", "suspended"]).optional(),
  ssiNo: z.string().optional(),
  panNo: z.string().optional(),
  phone: z.string().optional(),
  esiNo: z.string().optional(),
  address: z.string().optional(),
  epfNo: z.string().optional(),
  logoUrl: z.string().max(12000000).optional().nullable(),
  signatureUrl: z.string().max(12000000).optional().nullable(),
  signatureWidth: z.coerce.number().int().min(40).max(600).optional(),
  signatureHeight: z.coerce.number().int().min(20).max(300).optional(),
}); 

export type CompanyFormData = z.infer<typeof companySchema>;

export const toCompanySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(100, "Company name is too long"),
  gstNo: z.string().trim().max(50).optional().or(z.literal("")),
  vendorCode: z.string().trim().max(50).optional().or(z.literal("")),
  email: z.string().trim().max(100).optional().or(z.literal("")).refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), "Invalid email address"),
  address: z.string().max(500).optional().or(z.literal("")),
  state: z.string().trim().max(50).optional().or(z.literal("")),
  stateCode: z.string().trim().max(5).optional().or(z.literal("")),
  date: z.string().min(1, "Date is required"),
});

export type ToCompanyFormData = z.infer<typeof toCompanySchema>;

export const referralSchema = z.object({
  name: z.string().min(1, "Referral name is required").max(100, "Referral name is too long"),
  email: z
    .string()
    .optional()
    .refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email address"),
  mobile: z.string().optional(),
  date: z.string().min(1, "Date is required"),
});

export type ReferralFormData = z.infer<typeof referralSchema>;

export const purchaseSchema = z.object({
  companyId: z.number().int().positive().nullable().optional(),
  gstNo: z.string().optional(),
  partyName: z.string().min(1, "Party name is required").max(100, "Party name is too long"),
  invoiceNo: z.string().min(1, "Invoice number is required").max(50, "Invoice number is too long"),
  invoiceDate: z.string().min(1, "Invoice date is required"),
  state: z.string().optional(),
  rate: z.coerce.number().min(0, "Rate must be positive"),
  taxableValue: z.coerce.number().min(0, "Taxable value must be positive"),
  igst: z.coerce.number().min(0, "IGST must be positive").optional(),
  cgst: z.coerce.number().min(0, "CGST must be positive").optional(),
  sgst: z.coerce.number().min(0, "SGST must be positive").optional(),
  totalAmount: z.coerce.number().min(0, "Total amount must be positive"),
  items: z.array(z.object({
    productId: z.coerce.number().int().positive().nullable().optional(),
    description: z.string().min(1, "Product description is required").max(255),
    hsn: z.string().max(20).optional().or(z.literal("")),
    quantity: z.coerce.number().positive("Quantity must be greater than zero"),
    unit: z.string().max(20).optional(),
    unitPrice: z.coerce.number().min(0),
    gstRate: z.coerce.number().min(0).max(100),
    taxableValue: z.coerce.number().min(0),
    igst: z.coerce.number().min(0).optional(),
    cgst: z.coerce.number().min(0).optional(),
    sgst: z.coerce.number().min(0).optional(),
    totalAmount: z.coerce.number().min(0),
  })).optional().default([]),
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;

const optionalInvoiceText = (max: number) => z.string().max(max).nullish();

export function normalizeInvoicePayload(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return input;
  const source = input as Record<string, unknown>;
  const numeric = (value: unknown) => value === null || value === undefined || value === "" ? value : Number(value);
  const normalized: Record<string, unknown> = { ...source };
  for (const key of ["amount", "total", "cgstRate", "sgstRate", "igstRate", "discountAmount"]) {
    if (key in source) normalized[key] = numeric(source[key]);
  }
  if (Array.isArray(source.items)) {
    normalized.items = source.items.map((item) => {
      if (!item || typeof item !== "object" || Array.isArray(item)) return item;
      const row = item as Record<string, unknown>;
      const copy: Record<string, unknown> = { ...row };
      for (const key of ["quantity", "price", "amount", "igstRate", "cgstRate", "sgstRate"]) {
        if (key in row) copy[key] = numeric(row[key]);
      }
      return copy;
    });
  }
  return normalized;
}

export const invoiceSchema = z.object({
  orderId: z.string().trim().min(1).max(50),
  companyId: z.number().int().positive().nullable().optional(),
  toCompanyId: z.number().int().positive().nullable().optional(),
  billToCompanyId: z.number().int().positive().nullable().optional(),
  shipToCompanyId: z.number().int().positive().nullable().optional(),
  email: optionalInvoiceText(100),
  gst: optionalInvoiceText(50),
  amount: z.coerce.number().finite().optional(),
  total: z.number().finite().optional(),
  date: z.string().refine((value) => !Number.isNaN(new Date(value).getTime())),
  taxType: z.enum(["CGST_SGST", "IGST", "WITHOUT_GST"]).default("CGST_SGST"),
  cgstRate: z.number().finite().min(0).max(100).default(0),
  sgstRate: z.number().finite().min(0).max(100).default(0),
  igstRate: z.number().finite().min(0).max(100).default(0),
  reverseCharge: z.boolean().default(false),
  invoiceNo: optionalInvoiceText(50),
  manualNumberOverride: z.boolean().optional().default(false),
  documentType: z.enum(["TAX_INVOICE", "PROFORMA"]).default("TAX_INVOICE"),
  discountAmount: z.number().finite().min(0).max(9999999999.99).default(0),
  kindAttn: optionalInvoiceText(150),
  mobileNo: optionalInvoiceText(30),
  poNumber: optionalInvoiceText(50),
  poDate: z.string().nullish(),
  challanNo: optionalInvoiceText(50),
  transportMode: optionalInvoiceText(50),
  vehicleNo: optionalInvoiceText(50),
  dateOfSupply: z.string().nullish(),
  placeOfSupply: optionalInvoiceText(100),
  stateCode: optionalInvoiceText(5),
  bankHolderName: optionalInvoiceText(100),
  bankAccountNumber: optionalInvoiceText(50),
  bankIfscCode: optionalInvoiceText(20),
  bankName: optionalInvoiceText(100),
  bankBranchName: optionalInvoiceText(100),
  billToName: optionalInvoiceText(200),
  billToAddress: optionalInvoiceText(500),
  billToGstin: optionalInvoiceText(50),
  billToEmail: optionalInvoiceText(100),
  billToState: optionalInvoiceText(50),
  billToStateCode: optionalInvoiceText(5),
  shipToName: optionalInvoiceText(200),
  shipToAddress: optionalInvoiceText(500),
  shipToGstin: optionalInvoiceText(50),
  shipToEmail: optionalInvoiceText(100),
  shipToState: optionalInvoiceText(50),
  shipToStateCode: optionalInvoiceText(5),
  termsAndConditions: z.string().nullish(),
  logoUrl: z.string().nullish(),
  phone: optionalInvoiceText(100),
  items: z
    .array(
      z.object({
        description: optionalInvoiceText(255),
        hsn: optionalInvoiceText(20),
        sac: optionalInvoiceText(20),
        quantity: z.coerce.number().finite().min(0).max(1_000_000),
        unit: optionalInvoiceText(10),
        price: z.coerce.number().finite().min(0).max(9_999_999_999.99),
        per: optionalInvoiceText(10),
        amount: z.coerce.number().finite().optional(),
        gstType: z.enum(["CGST_SGST", "IGST", "WITHOUT_GST"]).nullish(),
        igstRate: z.coerce.number().finite().min(0).max(100).nullish(),
        cgstRate: z.coerce.number().finite().min(0).max(100).nullish(),
        sgstRate: z.coerce.number().finite().min(0).max(100).nullish(),
      })
    )
    .min(1)
    .max(500),
});

export type InvoiceInput = z.infer<typeof invoiceSchema>;

const userFields = {
  firstName: z.string().trim().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().trim().min(1, "Last name is required").max(50, "Last name is too long"),
  username: z.string().trim().min(3, "Username must be at least 3 characters").max(50, "Username is too long").regex(/^[A-Za-z0-9._-]+$/, "Username contains invalid characters"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email"),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sidebarAccess: z.array(z.string()).optional(),
  actionPermissions: z.record(z.string(), z.record(z.string(), z.boolean())).optional(),
};

// Creation requires a new password. Editing permits an empty password to keep
// the existing hash, or a new password of 4–128 characters.
export const userSchema = z.object({
  ...userFields,
  password: z.string()
    .max(128, "Password must be 128 characters or fewer")
    .refine((value) => value === "" || value.length >= 4, "Password must be at least 4 characters"),
});

export type UserFormData = z.infer<typeof userSchema>;
