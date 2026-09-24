"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toCompanySchema, type ToCompanyFormData } from "@/lib/validations";
import type { ToCompany } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X, AlertCircle } from "lucide-react";

interface ToCompanyFormProps {
  company?: ToCompany;
  onSubmit: (data: ToCompanyFormData) => void | Promise<boolean | void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ToCompanyForm({ company, onSubmit, onCancel, isLoading }: ToCompanyFormProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ToCompanyFormData>({
    resolver: zodResolver(toCompanySchema),
    defaultValues: {
      name: company?.name ?? "",
      gstNo: company?.gstNo ?? "",
      vendorCode: company?.vendorCode ?? "",
      date: company?.date ?? new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (company) {
      reset({
        name: company.name,
        gstNo: company.gstNo,
        vendorCode: company.vendorCode,
        date: company.date,
      });
    }
  }, [company, reset]);

  const handleSubmitForm = async (data: ToCompanyFormData) => {
    setServerError(null);
    const result = await onSubmit(data);
    if (result === false) {
      setServerError("A to-company with this name already exists");
    }
  };

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-5">
      {serverError && (
        <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/5 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="size-4 shrink-0" />
          {serverError}
        </div>
      )}

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
          <Label htmlFor="vendorCode" className="text-sm font-medium">
            Vendor Code
          </Label>
          <Input id="vendorCode" placeholder="Enter vendor code" {...register("vendorCode")} />
        </div>

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
