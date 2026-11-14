"use client";

import { useEffect, type ChangeEvent } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import type { z } from "zod";
import { companySchema, type CompanyFormData } from "@/lib/validations";
import type { Company } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Building2, CalendarDays, FileText, CreditCard, Users, ShieldCheck,
  Mail, Phone, MapPin, Layers3, ImagePlus, PenLine, Upload, Save,
  X, Loader2, ChevronDown, Trash2, CheckCircle2,
  type LucideIcon,
} from "lucide-react";

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const fieldClass =
  "h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm text-slate-800 shadow-sm transition placeholder:text-slate-400 hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-4 focus-visible:ring-blue-500/10";

function SectionHeading({
  icon: Icon,
  title,
  description,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-4 flex items-center gap-3 border-b border-blue-100 pb-3">
      <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
        <Icon className="size-[18px]" />
      </span>
      <div className="min-w-0">
        <h3 className="text-sm font-bold tracking-tight text-slate-900">{title}</h3>
        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
      </div>
    </div>
  );
}

export function CompanyForm({ company, onSubmit, onCancel, isLoading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<z.input<typeof companySchema>, unknown, CompanyFormData>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      gstNo: company?.gstNo ?? "",
      email: company?.email ?? "",
      date: company?.date ?? new Date().toISOString().split("T")[0],
      status: (company?.status ?? "active") as "active" | "inactive" | "pending" | "suspended",
      ssiNo: company?.ssiNo ?? "",
      panNo: company?.panNo ?? "",
      phone: company?.phone ?? "",
      esiNo: company?.esiNo ?? "",
      address: company?.address ?? "",
      epfNo: company?.epfNo ?? "",
      logoUrl: company?.logoUrl ?? "",
      signatureUrl: company?.signatureUrl ?? "",
      signatureWidth: company?.signatureWidth ?? 160,
      signatureHeight: company?.signatureHeight ?? 60,
    },
  });

  useEffect(() => {
    if (!company) return;
    reset({
      name: company.name,
      gstNo: company.gstNo,
      email: company.email,
      date: company.date,
      status: company.status as CompanyFormData["status"],
      ssiNo: company.ssiNo,
      panNo: company.panNo,
      phone: company.phone,
      esiNo: company.esiNo,
      address: company.address,
      epfNo: company.epfNo,
      logoUrl: company.logoUrl ?? "",
      signatureUrl: company.signatureUrl ?? "",
      signatureWidth: company.signatureWidth ?? 160,
      signatureHeight: company.signatureHeight ?? 60,
    });
  }, [company, reset]);

  const logoUrl = watch("logoUrl");
  const signatureUrl = watch("signatureUrl");
  const signatureWidth = watch("signatureWidth") ?? 160;
  const signatureHeight = watch("signatureHeight") ?? 60;

  const readImage = (
    event: ChangeEvent<HTMLInputElement>,
    field: "logoUrl" | "signatureUrl",
    label: string,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      window.alert(`${label} must be 2 MB or smaller`);
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setValue(field, String(reader.result), { shouldDirty: true, shouldValidate: true });
    reader.readAsDataURL(file);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex min-h-0 flex-col">
      <div className="max-h-[calc(92vh-150px)] space-y-4 overflow-y-auto bg-slate-50/70 px-5 py-5 sm:px-6">
        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading icon={Building2} title="Company Details" description="Business registration, contact and account information" />

          <div className="grid gap-x-6 gap-y-4 md:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Building2 className="size-3.5 text-blue-700" />Company Name <span className="text-red-500">*</span></Label>
              <Input id="name" placeholder="Enter company name" className={fieldClass} {...register("name")} aria-invalid={!!errors.name} />
              {errors.name && <p className="text-xs text-red-600" role="alert">{errors.name.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="date" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CalendarDays className="size-3.5 text-blue-700" />Date <span className="text-red-500">*</span></Label>
              <Input id="date" type="date" className={fieldClass} {...register("date")} aria-invalid={!!errors.date} />
              {errors.date && <p className="text-xs text-red-600" role="alert">{errors.date.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="gstNo" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><FileText className="size-3.5 text-blue-700" />GST No</Label>
              <Input id="gstNo" placeholder="Enter GST number" className={fieldClass} {...register("gstNo")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Mail className="size-3.5 text-blue-700" />Email</Label>
              <Input id="email" type="email" placeholder="Enter email address" className={fieldClass} {...register("email")} aria-invalid={!!errors.email} />
              {errors.email && <p className="text-xs text-red-600" role="alert">{errors.email.message}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="panNo" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CreditCard className="size-3.5 text-blue-700" />PAN No</Label>
              <Input id="panNo" placeholder="Enter PAN number" className={fieldClass} {...register("panNo")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Phone className="size-3.5 text-blue-700" />Phone Number</Label>
              <Input id="phone" placeholder="Enter phone number" className={fieldClass} {...register("phone")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="esiNo" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Users className="size-3.5 text-blue-700" />ESI No</Label>
              <Input id="esiNo" placeholder="Enter ESI number" className={fieldClass} {...register("esiNo")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ssiNo" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><Layers3 className="size-3.5 text-blue-700" />SSI No</Label>
              <Input id="ssiNo" placeholder="Enter SSI number" className={fieldClass} {...register("ssiNo")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="epfNo" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><ShieldCheck className="size-3.5 text-blue-700" />EPF No</Label>
              <Input id="epfNo" placeholder="Enter EPF number" className={fieldClass} {...register("epfNo")} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><MapPin className="size-3.5 text-blue-700" />Address</Label>
              <textarea id="address" placeholder="Enter company address" rows={2} {...register("address")} className={`${fieldClass} h-auto min-h-[76px] resize-y py-2.5`} />
            </div>

            <div className="space-y-1.5 md:col-start-2">
              <Label htmlFor="status" className="flex items-center gap-2 text-xs font-semibold text-slate-700"><CheckCircle2 className="size-3.5 text-blue-700" />Status</Label>
              <div className="relative">
                <select id="status" {...register("status")} className={`${fieldClass} appearance-none pr-9`}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="pending">Pending</option>
                  <option value="suspended">Suspended</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" />
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading icon={ImagePlus} title="Company Logo" description="This logo is displayed on company invoices and documents" />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <div className="flex h-20 w-40 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
              {logoUrl ? <img src={logoUrl} alt="Company logo preview" className="h-full w-full object-contain" /> : <div className="flex flex-col items-center gap-1 text-slate-400"><ImagePlus className="size-5" /><span className="text-xs">No logo uploaded</span></div>}
            </div>
            <div className="space-y-2">
              <label htmlFor="companyLogo" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-3.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100">
                <Upload className="size-3.5" />Choose Logo
              </label>
              <input id="companyLogo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" className="sr-only" onChange={(event) => readImage(event, "logoUrl", "Logo")} />
              <p className="text-xs text-slate-500">PNG, JPG, WEBP or SVG · Maximum 2 MB</p>
              {logoUrl && <button type="button" className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700" onClick={() => setValue("logoUrl", "", { shouldDirty: true })}><Trash2 className="size-3" />Remove logo</button>}
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm sm:p-5">
          <SectionHeading icon={PenLine} title="Authorized Digital Signature" description="Upload a transparent signature image for this company profile" />
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.5fr)] lg:items-center">
            <div className="flex min-h-20 items-center justify-center overflow-hidden rounded-xl border border-dashed border-slate-300 bg-slate-50 p-2">
              {signatureUrl ? <img src={signatureUrl} alt="Digital signature preview" style={{ width: `${signatureWidth}px`, height: `${signatureHeight}px` }} className="max-h-24 max-w-full object-contain" /> : <div className="flex flex-col items-center gap-1 text-slate-400"><PenLine className="size-5" /><span className="text-xs">No signature uploaded</span></div>}
            </div>
            <div className="space-y-3">
              <div>
                <label htmlFor="signatureFile" className="inline-flex h-9 cursor-pointer items-center gap-2 rounded-xl border border-violet-300 bg-violet-50 px-3.5 text-xs font-semibold text-violet-700 transition hover:bg-violet-100"><Upload className="size-3.5" />Choose Signature</label>
                <input id="signatureFile" type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(event) => readImage(event, "signatureUrl", "Signature")} />
                <p className="mt-1.5 text-xs text-slate-500">Transparent PNG/JPEG/WEBP · Maximum 2 MB</p>
                {signatureUrl && <button type="button" className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700" onClick={() => setValue("signatureUrl", "", { shouldDirty: true })}><Trash2 className="size-3" />Remove signature</button>}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1"><Label htmlFor="signatureWidth" className="text-xs font-semibold text-slate-700">Signature width (px)</Label><Input id="signatureWidth" type="number" min="40" max="600" className={fieldClass} {...register("signatureWidth", { valueAsNumber: true })} /></div>
                <div className="space-y-1"><Label htmlFor="signatureHeight" className="text-xs font-semibold text-slate-700">Signature height (px)</Label><Input id="signatureHeight" type="number" min="20" max="300" className={fieldClass} {...register("signatureHeight", { valueAsNumber: true })} /></div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="flex shrink-0 items-center justify-end gap-2 border-t border-slate-200 bg-white px-5 py-4 sm:px-6">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading} className="h-10 rounded-xl border-slate-200 px-4 text-slate-700 hover:bg-slate-50">
          <X className="size-4" />Cancel
        </Button>
        <Button type="submit" disabled={isLoading} className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-700 px-5 font-semibold text-white shadow-md shadow-blue-600/20 hover:from-blue-700 hover:to-indigo-800">
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {company ? "Update Company" : "Add Company"}
        </Button>
      </div>
    </form>
  );
}
