"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSession } from "@/components/auth/session-provider";
import {
  UserRound, Mail, Phone, ShieldCheck, Building2, CalendarDays,
  CheckCircle2, Save, RotateCcw, LockKeyhole, Layers3, Eye, EyeOff
} from "lucide-react";

type ProfileData = {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string | null;
  phone: string | null;
  role: string;
  status: string;
  createdAt: string;
  workspace: string;
  modules: string[];
  profileImage: string | null;
};

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard", companies: "Companies", products: "Product Management",
  "to-companies": "To Company (Sales)", invoices: "Tax Invoices",
  "proforma-invoices": "Proforma Invoices", "delivery-challans": "Delivery Challans",
  vendors: "Vendor Details", "purchase-orders": "Purchase Orders", purchases: "Purchased Invoices",
  "turnover-report": "Turnover Report", referrals: "Referral", "import-export": "Import / Export",
  users: "Users", settings: "Settings", "superadmin-admins": "Admin Workspaces"
};

export function ProfilePage() {
  const { user, refresh } = useSession();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  const [showPasswords, setShowPasswords] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoMessage, setPhotoMessage] = useState("");
  const [photoError, setPhotoError] = useState("");

  async function loadProfile() {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/profile", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to load profile");
      setProfile(data);
      setForm({
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        email: data.email || "",
        phone: data.phone || ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load profile");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void loadProfile(); }, []);

  const displayName = useMemo(
    () => profile ? `${profile.firstName} ${profile.lastName}`.trim() : "",
    [profile]
  );
  const initials = `${form.firstName.charAt(0)}${form.lastName.charAt(0)}`.toUpperCase() || "U";
  const roleLabel = profile?.role === "SUPERADMIN" ? "Superadmin" : profile?.role === "ADMIN" ? "Administrator" : "User";

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to save profile");
      setMessage("Profile updated successfully.");
      await loadProfile();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfilePhoto(file?: File) {
    if (!file) return;
    setPhotoMessage("");
    setPhotoError("");
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setPhotoError("Choose a JPG, PNG or WebP image.");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setPhotoError("Image must be smaller than 2 MB.");
      return;
    }
    setPhotoBusy(true);
    try {
      const imageDataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => typeof reader.result === "string" ? resolve(reader.result) : reject(new Error("Unable to read image"));
        reader.onerror = () => reject(new Error("Unable to read image"));
        reader.readAsDataURL(file);
      });
      const response = await fetch("/api/profile/photo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageDataUrl })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to upload photo");
      setPhotoMessage(result.message || "Profile photo updated.");
      await loadProfile();
      await refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Unable to upload photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function removeProfilePhoto() {
    setPhotoBusy(true);
    setPhotoMessage("");
    setPhotoError("");
    try {
      const response = await fetch("/api/profile/photo", { method: "DELETE" });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to remove photo");
      setPhotoMessage(result.message || "Profile photo removed.");
      await loadProfile();
      await refresh();
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : "Unable to remove photo");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPasswordSaving(true);
    setPasswordMessage("");
    setPasswordError("");
    try {
      const response = await fetch("/api/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwordForm)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to change password");
      setPasswordMessage(result.message || "Password changed successfully.");
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : "Unable to change password");
    } finally {
      setPasswordSaving(false);
    }
  }

  const inputClass = "mt-2 h-11 w-full rounded-xl border border-border bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/10";
  const roleTone = profile?.status === "active" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700";

  return (
    <div className="mx-auto max-w-7xl space-y-6 pb-10">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
        <div>
          <p className="text-sm font-medium text-primary">Account settings</p>
          <h1 className="mt-1 text-3xl font-bold tracking-tight">My Profile</h1>
          <p className="mt-1 text-sm text-muted-foreground">Manage your personal information and review your account access.</p>
        </div>
        <div className="text-sm text-muted-foreground">Dashboard <span className="mx-2">/</span> My Profile</div>
      </div>

      {message && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">{message}</div>}
      {error && <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>}

      {loading ? (
        <div className="rounded-2xl border bg-card p-10 text-center text-sm text-muted-foreground">Loading profile...</div>
      ) : profile ? (
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
          <section className="rounded-2xl border border-border/70 bg-card shadow-sm">
            <div className="border-b border-border/70 p-6">
              <div className="flex items-center gap-4">
                <div className="relative flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-primary to-indigo-500 text-xl font-bold text-white shadow-lg shadow-primary/20">
                  {profile.profileImage ? <img src={profile.profileImage} alt="Profile" className="h-full w-full object-cover" /> : initials}
                </div>
                <div className="min-w-0">
                  <h2 className="text-xl font-semibold">{displayName || profile.username}</h2>
                  <p className="mt-1 text-sm text-muted-foreground">{profile.username} · {roleLabel}</p>
                  <span className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${roleTone}`}>{profile.status}</span>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <label className={`inline-flex h-9 cursor-pointer items-center rounded-lg bg-primary px-4 text-xs font-semibold text-primary-foreground ${photoBusy ? "pointer-events-none opacity-60" : ""}`}>
                  {photoBusy ? "Uploading..." : "Upload photo"}
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" disabled={photoBusy} onChange={e => { void uploadProfilePhoto(e.target.files?.[0]); e.currentTarget.value = ""; }} />
                </label>
                {profile.profileImage && <button type="button" disabled={photoBusy} onClick={() => void removeProfilePhoto()} className="h-9 rounded-lg border border-border px-4 text-xs font-medium hover:bg-muted disabled:opacity-60">Remove photo</button>}
                <span className="text-xs text-muted-foreground">JPG, PNG or WebP · Maximum 2 MB</span>
              </div>
              {photoMessage && <p role="status" className="mt-3 text-xs text-emerald-700">{photoMessage}</p>}
              {photoError && <p role="alert" className="mt-3 text-xs text-rose-700">{photoError}</p>}
            </div>
            <form onSubmit={saveProfile} className="space-y-6 p-6">
              <div>
                <h3 className="font-semibold">Personal information</h3>
                <p className="mt-1 text-sm text-muted-foreground">Update the contact details associated with your sign-in account.</p>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="text-sm font-medium">First name *
                  <input className={inputClass} maxLength={50} required value={form.firstName} onChange={e => setForm(v => ({...v, firstName:e.target.value}))} />
                </label>
                <label className="text-sm font-medium">Last name *
                  <input className={inputClass} maxLength={50} required value={form.lastName} onChange={e => setForm(v => ({...v, lastName:e.target.value}))} />
                </label>
                <label className="text-sm font-medium">Email address
                  <span className="relative block"><Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input className={`${inputClass} pl-10`} type="email" maxLength={100} value={form.email} onChange={e => setForm(v => ({...v, email:e.target.value}))} placeholder="name@company.com"/></span>
                </label>
                <label className="text-sm font-medium">Mobile number
                  <span className="relative block"><Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"/><input className={`${inputClass} pl-10`} maxLength={20} value={form.phone} onChange={e => setForm(v => ({...v, phone:e.target.value}))} placeholder="Enter mobile number"/></span>
                </label>
              </div>
              <div className="grid gap-4 rounded-xl bg-muted/40 p-4 sm:grid-cols-2">
                <div><p className="text-xs text-muted-foreground">Username</p><p className="mt-1 text-sm font-semibold">{profile.username}</p></div>
                <div><p className="text-xs text-muted-foreground">Role</p><p className="mt-1 text-sm font-semibold">{roleLabel}</p></div>
              </div>
              <div className="flex flex-wrap gap-3 border-t border-border/70 pt-5">
                <button disabled={saving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 disabled:opacity-60"><Save className="size-4"/>{saving ? "Saving..." : "Save changes"}</button>
                <button type="button" onClick={() => setForm({firstName:profile.firstName,lastName:profile.lastName,email:profile.email || "",phone:profile.phone || ""})} className="inline-flex h-10 items-center gap-2 rounded-xl border border-border px-4 text-sm font-medium hover:bg-muted"><RotateCcw className="size-4"/>Reset</button>
              </div>
            </form>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-primary/10 p-2.5 text-primary"><ShieldCheck className="size-5"/></div><div><h3 className="font-semibold">Account summary</h3><p className="text-xs text-muted-foreground">Your account details</p></div></div>
              <div className="mt-5 divide-y divide-border/70">
                <div className="flex justify-between gap-3 py-3 text-sm"><span className="text-muted-foreground">User ID</span><strong>USR-{String(profile.id).padStart(4,"0")}</strong></div>
                <div className="flex justify-between gap-3 py-3 text-sm"><span className="text-muted-foreground">Role</span><strong>{roleLabel}</strong></div>
                <div className="flex justify-between gap-3 py-3 text-sm"><span className="text-muted-foreground">Workspace</span><strong className="text-right">{profile.workspace}</strong></div>
                <div className="flex justify-between gap-3 py-3 text-sm"><span className="text-muted-foreground">Member since</span><strong>{new Date(profile.createdAt).toLocaleDateString("en-IN",{day:"2-digit",month:"short",year:"numeric"})}</strong></div>
                <div className="flex justify-between gap-3 py-3 text-sm"><span className="text-muted-foreground">Account status</span><strong className="capitalize">{profile.status}</strong></div>
              </div>
            </section>
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3"><div className="rounded-xl bg-indigo-500/10 p-2.5 text-indigo-600"><Layers3 className="size-5"/></div><div><h3 className="font-semibold">My access</h3><p className="text-xs text-muted-foreground">Modules available for your role</p></div></div>
              <div className="mt-5 flex flex-wrap gap-2">
                {profile.modules.map(module => <span key={module} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-2 text-xs font-medium"><CheckCircle2 className="size-3.5 text-emerald-600"/>{moduleLabels[module] || module}</span>)}
                {!profile.modules.length && <p className="text-sm text-muted-foreground">No modules are currently assigned.</p>}
              </div>
            </section>
            <section className="rounded-2xl border border-border/70 bg-card p-6 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-primary/10 p-2.5 text-primary"><LockKeyhole className="size-5"/></div>
                <div><h3 className="font-semibold">Change password</h3><p className="text-xs text-muted-foreground">Update your sign-in password securely.</p></div>
              </div>
              {passwordMessage && <div role="status" className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800">{passwordMessage}</div>}
              {passwordError && <div role="alert" className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">{passwordError}</div>}
              <form onSubmit={changePassword} className="mt-4 space-y-3">
                <label className="block text-sm font-medium">Current password
                  <input className={inputClass} type="password" autoComplete="current-password" required value={passwordForm.currentPassword} onChange={e => setPasswordForm(v => ({...v,currentPassword:e.target.value}))}/>
                </label>
                <label className="block text-sm font-medium">New password
                  <span className="relative block"><input className={`${inputClass} pr-11`} type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={4} maxLength={128} required value={passwordForm.newPassword} onChange={e => setPasswordForm(v => ({...v,newPassword:e.target.value}))}/><button type="button" aria-label={showPasswords ? "Hide passwords" : "Show passwords"} onClick={() => setShowPasswords(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPasswords ? <EyeOff className="size-4"/> : <Eye className="size-4"/>}</button></span>
                </label>
                <label className="block text-sm font-medium">Confirm new password
                  <input className={inputClass} type={showPasswords ? "text" : "password"} autoComplete="new-password" minLength={4} maxLength={128} required value={passwordForm.confirmPassword} onChange={e => setPasswordForm(v => ({...v,confirmPassword:e.target.value}))}/>
                </label>
                <p className="text-xs text-muted-foreground">Use 4–128 characters. Other active sessions will be signed out after the password changes.</p>
                <button disabled={passwordSaving} className="inline-flex h-10 items-center gap-2 rounded-xl bg-primary px-4 text-sm font-semibold text-primary-foreground disabled:opacity-60"><LockKeyhole className="size-4"/>{passwordSaving ? "Updating..." : "Update password"}</button>
              </form>
            </section>
          </div>
        </div>
      ) : null}
    </div>
  );
}
