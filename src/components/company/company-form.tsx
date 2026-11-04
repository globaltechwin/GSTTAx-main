"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { companySchema, type CompanyFormData } from "@/lib/validations";
import type { Company } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X, ChevronDown } from "lucide-react";

interface CompanyFormProps {
  company?: Company;
  onSubmit: (data: CompanyFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function CompanyForm({ company, onSubmit, onCancel, isLoading }: CompanyFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<CompanyFormData>({
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
    },
  });

  useEffect(() => {
    if (company) {
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
      });
    }
  }, [company, reset]);

  const logoUrl = watch("logoUrl");

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        {/* Left Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium">
              Company Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter company name"
              {...register("name")}
              aria-invalid={!!errors.name}
            />
            {errors.name && (
              <p className="text-destructive text-xs" role="alert">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="gstNo" className="text-sm font-medium">
              GST No
            </Label>
            <Input id="gstNo" placeholder="Enter GST number" {...register("gstNo")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="panNo" className="text-sm font-medium">
              PAN No
            </Label>
            <Input id="panNo" placeholder="Enter PAN number" {...register("panNo")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="esiNo" className="text-sm font-medium">
              ESI No
            </Label>
            <Input id="esiNo" placeholder="Enter ESI number" {...register("esiNo")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="epfNo" className="text-sm font-medium">
              EPF No
            </Label>
            <Input id="epfNo" placeholder="Enter EPF number" {...register("epfNo")} />
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </Label>
            <Input id="date" type="date" {...register("date")} aria-invalid={!!errors.date} />
            {errors.date && (
              <p className="text-destructive text-xs" role="alert">
                {errors.date.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              {...register("email")}
            />
            {errors.email && (
              <p className="text-destructive text-xs" role="alert">
                {errors.email.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              Phone Number
            </Label>
            <Input id="phone" placeholder="Enter phone number" {...register("phone")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="ssiNo" className="text-sm font-medium">
              SSI No
            </Label>
            <Input id="ssiNo" placeholder="Enter SSI number" {...register("ssiNo")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium">
              Address
            </Label>
            <Input id="address" placeholder="Enter address" {...register("address")} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium">
              Status
            </Label>
            <div className="relative">
              <select
                id="status"
                {...register("status")}
                className="border-input bg-background focus:ring-ring/50 h-8 w-full appearance-none rounded-lg border px-2.5 pr-8 text-sm transition-colors outline-none focus:ring-3 md:text-sm"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
              <ChevronDown className="text-muted-foreground pointer-events-none absolute top-1/2 right-2.5 size-4 -translate-y-1/2" />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t pt-4">
        <Label htmlFor="companyLogo">Company Logo (used on invoices)</Label>
        <div className="flex flex-wrap items-center gap-3">
          {logoUrl ? <img src={logoUrl} alt="Company logo preview" className="h-16 w-24 rounded border bg-white object-contain p-1" /> : <div className="flex h-16 w-24 items-center justify-center rounded border text-xs text-muted-foreground">No logo</div>}
          <div className="space-y-1">
            <Input id="companyLogo" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" onChange={(event) => { const file = event.target.files?.[0]; if (!file) return; if (file.size > 2 * 1024 * 1024) { window.alert("Logo must be 2 MB or smaller"); event.target.value = ""; return; } const reader = new FileReader(); reader.onload = () => setValue("logoUrl", String(reader.result), { shouldDirty: true }); reader.readAsDataURL(file); }} />
            <p className="text-xs text-muted-foreground">PNG, JPG, WEBP or SVG · maximum 2 MB</p>
            {logoUrl && <button type="button" className="text-xs text-destructive" onClick={() => setValue("logoUrl", "", { shouldDirty: true })}>Remove logo</button>}
          </div>
        </div>
      </div>

      <div className="border-border/60 flex items-center justify-end gap-3 border-t pt-5">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          <X className="size-4" />
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
          {company ? "Update Company" : "Add Company"}
        </Button>
      </div>
    </form>
  );
}
