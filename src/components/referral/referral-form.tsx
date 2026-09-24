"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { referralSchema, type ReferralFormData } from "@/lib/validations";
import type { Referral } from "@/lib/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Save, X } from "lucide-react";

interface ReferralFormProps {
  referral?: Referral;
  onSubmit: (data: ReferralFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function ReferralForm({ referral, onSubmit, onCancel, isLoading }: ReferralFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ReferralFormData>({
    resolver: zodResolver(referralSchema),
    defaultValues: {
      name: referral?.name ?? "",
      email: referral?.email ?? "",
      mobile: referral?.mobile ?? "",
      date: referral?.date ?? new Date().toISOString().split("T")[0],
    },
  });

  useEffect(() => {
    if (referral) {
      reset({
        name: referral.name,
        email: referral.email,
        mobile: referral.mobile,
        date: referral.date,
      });
    }
  }, [referral, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <div className="grid gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name" className="text-sm font-medium">
            Referral Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="name"
            placeholder="Enter referral name"
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
          <Label htmlFor="email" className="text-sm font-medium">
            Referral Email
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="Enter email address"
            {...register("email")}
            aria-invalid={!!errors.email}
          />
          {errors.email && (
            <p className="text-destructive text-xs" role="alert">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mobile" className="text-sm font-medium">
            Referral Mobile
          </Label>
          <Input id="mobile" type="tel" placeholder="Enter mobile number" {...register("mobile")} />
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
          {referral ? "Update Referral" : "Add Referral"}
        </Button>
      </div>
    </form>
  );
}
