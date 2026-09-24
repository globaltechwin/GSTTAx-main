import { z } from "zod";

export const companySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name is too long"),
  gstNo: z.string().optional(),
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
});

export type CompanyFormData = z.infer<typeof companySchema>;

export const toCompanySchema = z.object({
  name: z.string().min(1, "Company name is required").max(100, "Company name is too long"),
  gstNo: z.string().optional(),
  vendorCode: z.string().optional(),
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
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;

export const userSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50, "First name is too long"),
  lastName: z.string().min(1, "Last name is required").max(50, "Last name is too long"),
  username: z.string().min(1, "Username is required").max(50, "Username is too long"),
  password: z.string().min(4, "Password must be at least 4 characters").max(255, "Password is too long"),
  email: z.string().optional().refine((val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), "Invalid email"),
  phone: z.string().optional(),
  role: z.enum(["admin", "user"]).optional(),
  status: z.enum(["active", "inactive"]).optional(),
  sidebarAccess: z.array(z.string()).optional(),
});

export type UserFormData = z.infer<typeof userSchema>;
