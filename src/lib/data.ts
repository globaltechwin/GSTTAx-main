export interface Company {
  id: number;
  name: string;
  gstNo: string;
  email: string;
  date: string;
  status?: string;
  ssiNo: string;
  panNo: string;
  phone: string;
  esiNo: string;
  address: string;
  epfNo: string;
}

export const companies: Company[] = [
  {
    id: 1,
    name: "Touch4bill",
    gstNo: "",
    email: "rjszstems@gmail.com",
    date: "2026-04-28",
    status: "active",
    ssiNo: "",
    panNo: "",
    phone: "7010991925",
    esiNo: "",
    address: "123 Main Street, Chennai",
    epfNo: "",
  },
  {
    id: 2,
    name: "Company2",
    gstNo: "33Abcdef1234j1zh",
    email: "Email@Email.com",
    date: "2026-04-21",
    status: "active",
    ssiNo: "",
    panNo: "Asdfs1234a",
    phone: "123456789",
    esiNo: "",
    address: "456 Park Avenue, Mumbai",
    epfNo: "",
  },
  {
    id: 3,
    name: "Company1",
    gstNo: "22aabbccd9221j",
    email: "",
    date: "2026-04-21",
    status: "active",
    ssiNo: "",
    panNo: "23456hjkj1j",
    phone: "",
    esiNo: "",
    address: "789 Gandhi Road, Delhi",
    epfNo: "",
  },
];

export interface ToCompany {
  id: number;
  name: string;
  gstNo: string;
  vendorCode: string;
  date: string;
  createdAt?: string;
  updatedAt?: string;
}

export const toCompanies: ToCompany[] = [
  {
    id: 1,
    name: "SRP IT SOLUTIONS",
    gstNo: "",
    vendorCode: "10001",
    date: "2026-05-25",
  },
  {
    id: 2,
    name: "To Company1",
    gstNo: "Gst At To Company Added 1",
    vendorCode: "Vendor Code 1 At To Company Added",
    date: "2026-04-21",
  },
];

export const dashboardStats = {
  totalCompanies: 3,
  totalToCompanies: 2,
  totalInvoices: 2,
  username: "admin",
};

export interface Referral {
  id: number;
  name: string;
  email: string;
  mobile: string;
  date: string;
}

export const referrals: Referral[] = [
  {
    id: 1,
    name: "Rajesh Kumar",
    email: "rajesh.kumar@gmail.com",
    mobile: "9876543210",
    date: "2026-05-15",
  },
  {
    id: 2,
    name: "Priya Sharma",
    email: "priya.sharma@outlook.com",
    mobile: "8765432109",
    date: "2026-04-22",
  },
  {
    id: 3,
    name: "Amit Verma",
    email: "amit.verma@yahoo.com",
    mobile: "7654321098",
    date: "2026-06-10",
  },
];

export interface InvoiceItem {
  id: number;
  description: string;
  hsn: string;
  sac: string;
  quantity: number;
  price: number;
  per: string;
  amount: number;
  gstType?: string | null;
  igstRate?: number | null;
  cgstRate?: number | null;
  sgstRate?: number | null;
}

export interface Invoice {
  id: number;
  orderId: string;
  company: string;
  email: string;
  gst: string;
  amount: string;
  total: string;
  date: string;
}

export const invoices: Invoice[] = [
  {
    id: 1,
    orderId: "INV/BE/2019-2020/3547",
    company: "",
    email: "",
    gst: "",
    amount: "",
    total: "",
    date: "",
  },
  {
    id: 2,
    orderId: "INV/BE/2019-2020/13604",
    company: "",
    email: "",
    gst: "",
    amount: "",
    total: "",
    date: "",
  },
];

export interface Purchase {
  id: number;
  gstNo: string;
  partyName: string;
  invoiceNo: string;
  invoiceDate: string;
  state: string;
  rate: number;
  taxableValue: number;
  igst: number;
  cgst: number;
  sgst: number;
  totalAmount: number;
}

export interface AppUser {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  sidebarAccess: string[];
  createdAt: string;
}
