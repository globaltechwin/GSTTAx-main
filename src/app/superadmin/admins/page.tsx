"use client";

import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { MODULE_KEYS, type ModuleKey } from "@/lib/permissions";

interface AdminWorkspace {
  id: number;
  firstName: string;
  lastName: string;
  username: string;
  email: string | null;
  status: string;
  modules: string[];
  userCount: number;
  companyCount: number;
  invoiceCount: number;
  purchaseCount: number;
  createdAt: string;
}

interface AdminForm {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  email: string;
}

const emptyForm: AdminForm = {
  firstName: "",
  lastName: "",
  username: "",
  password: "",
  email: "",
};

function formatModule(module: string): string {
  return module
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export default function SuperadminAdminsPage() {
  const [admins, setAdmins] = useState<AdminWorkspace[]>([]);
  const [createModules, setCreateModules] = useState<ModuleKey[]>([...MODULE_KEYS]);
  const [editingModules, setEditingModules] = useState<ModuleKey[]>([]);
  const [form, setForm] = useState<AdminForm>(emptyForm);
  const [editing, setEditing] = useState<AdminWorkspace | null>(null);
  const [editingDetailsAdmin, setEditingDetailsAdmin] = useState<AdminWorkspace | null>(null);
  const [editingDetails, setEditingDetails] = useState<AdminForm>({ ...emptyForm, password: "" });
  const [deleting, setDeleting] = useState<AdminWorkspace | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showCreatePassword, setShowCreatePassword] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const loadAdmins = useCallback(async () => {
    try {
      const response = await fetch("/api/superadmin/admins?pageSize=100", {
        cache: "no-store",
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to load Admin workspaces");
      setAdmins(result.data);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load Admin workspaces");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/superadmin/admins?pageSize=100", { cache: "no-store" })
      .then(async (response) => {
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Unable to load Admin workspaces");
        if (active) setAdmins(result.data);
      })
      .catch((loadError) => {
        if (active) {
          setError(
            loadError instanceof Error ? loadError.message : "Unable to load Admin workspaces"
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const submitAdmin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/superadmin/admins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, modules: createModules }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to create Admin");
      setForm(emptyForm);
      setCreateModules([...MODULE_KEYS]);
      setNotice("Admin workspace created.");
      await loadAdmins();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to create Admin");
    } finally {
      setSaving(false);
    }
  };

  const changeStatus = async (admin: AdminWorkspace) => {
    setError(null);
    setNotice(null);
    try {
      const status = admin.status === "active" ? "inactive" : "active";
      const response = await fetch(`/api/superadmin/admins/${admin.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update Admin status");
      setNotice(`Admin account ${status === "active" ? "activated" : "deactivated"}.`);
      await loadAdmins();
    } catch (updateError) {
      setError(
        updateError instanceof Error ? updateError.message : "Unable to update Admin status"
      );
    }
  };

  const saveModules = async () => {
    // The module editor is tied to `editing`, not the separate Admin-details editor.
    if (!editing?.id) {
      setError("Select an Admin workspace before saving module access.");
      return;
    }
    setSaving(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch(`/api/superadmin/admins/${editing.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modules: editingModules }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update module access");
      setEditing(null);
      setEditingModules([]);
      setNotice(`Module access updated for @${editing.username}.`);
      await loadAdmins();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Unable to update permissions");
    } finally {
      setSaving(false);
    }
  };

  const toggleCreateModule = (module: ModuleKey) => {
    setCreateModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  };

  const toggleEditingModule = (module: ModuleKey) => {
    setEditingModules((current) => current.includes(module) ? current.filter((item) => item !== module) : [...current, module]);
  };

  const startEdit = (admin: AdminWorkspace) => {
    setEditing(null);
    setEditingDetailsAdmin(admin);
    setEditingDetails({ firstName: admin.firstName, lastName: admin.lastName, username: admin.username, email: admin.email || "", password: "" });
  };

  const saveAdminDetails = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editingDetailsAdmin) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const payload = {
        firstName: editingDetails.firstName,
        lastName: editingDetails.lastName,
        username: editingDetails.username,
        email: editingDetails.email,
        ...(editingDetails.password ? { password: editingDetails.password } : {}),
      };
      const response = await fetch(`/api/superadmin/admins/${editingDetailsAdmin.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update Admin details");
      setNotice(editingDetails.password ? "Admin details and password updated." : "Admin details updated.");
      setEditingDetailsAdmin(null); await loadAdmins();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to update Admin details"); }
    finally { setSaving(false); }
  };

  const deleteAdmin = async () => {
    if (!deleting || deleteConfirmation !== deleting.username) return;
    setSaving(true); setError(null); setNotice(null);
    try {
      const response = await fetch(`/api/superadmin/admins/${deleting.id}`, { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ confirmation: deleteConfirmation }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to delete Admin workspace");
      setNotice(`Admin workspace @${deleting.username} and its tenant data were permanently deleted.`);
      setDeleting(null); setDeleteConfirmation(""); if (editing?.id === deleting.id) setEditing(null); if (editingDetailsAdmin?.id === deleting.id) setEditingDetailsAdmin(null); await loadAdmins();
    } catch (e) { setError(e instanceof Error ? e.message : "Unable to delete Admin workspace"); }
    finally { setSaving(false); }
  };

  return (
    <>
      <div>
        <h1 className="text-foreground text-2xl font-bold">Admin workspaces</h1>
        <p className="text-muted-foreground mt-1 text-sm">
          Create and manage tenant Admin accounts and their available modules.
        </p>
      </div>

      {error && (
        <p
          className="text-destructive rounded-lg border border-red-200 bg-red-50 p-3 text-sm"
          role="alert"
        >
          {error}
        </p>
      )}
      {notice && (
        <p
          className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800"
          role="status"
        >
          {notice}
        </p>
      )}

      <section className="border-border/60 bg-card rounded-xl border p-5">
        <h2 className="text-foreground font-semibold">Create Admin workspace</h2>
        <form onSubmit={submitAdmin} className="mt-4 space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-muted-foreground space-y-1 text-sm">
              First name
              <input
                required
                maxLength={50}
                value={form.firstName}
                onChange={(event) => setForm({ ...form, firstName: event.target.value })}
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="text-muted-foreground space-y-1 text-sm">
              Last name
              <input
                required
                maxLength={50}
                value={form.lastName}
                onChange={(event) => setForm({ ...form, lastName: event.target.value })}
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="text-muted-foreground space-y-1 text-sm">
              Username
              <input
                required
                minLength={3}
                maxLength={50}
                pattern="[A-Za-z0-9._-]+"
                autoComplete="off"
                value={form.username}
                onChange={(event) => setForm({ ...form, username: event.target.value })}
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
              />
            </label>
            <label className="text-muted-foreground space-y-1 text-sm">
              Password
              <div className="relative">
                <input
                  required
                  type={showCreatePassword ? "text" : "password"}
                  autoComplete="new-password"
                  value={form.password}
                  onChange={(event) => setForm({ ...form, password: event.target.value })}
                  className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2 pr-10"
                />
                <button type="button" onClick={() => setShowCreatePassword((shown) => !shown)} aria-label={showCreatePassword ? "Hide password" : "Show password"} aria-pressed={showCreatePassword} className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3">
                  {showCreatePassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </label>
            <label className="text-muted-foreground space-y-1 text-sm">
              Email (optional)
              <input
                type="email"
                maxLength={100}
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                className="border-border bg-background text-foreground w-full rounded-md border px-3 py-2"
              />
            </label>
          </div>
          <fieldset>
            <legend className="text-foreground mb-2 text-sm font-medium">Available modules</legend>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {MODULE_KEYS.map((module) => (
                <label
                  key={module}
                  className="text-muted-foreground flex items-center gap-2 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={createModules.includes(module)}
                    onChange={() => toggleCreateModule(module)}
                  />
                  {formatModule(module)}
                </label>
              ))}
            </div>
          </fieldset>
          <button
            type="submit"
            disabled={saving}
            className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Admin"}
          </button>
        </form>
      </section>

      {editingDetailsAdmin && (
        <section className="border-primary/30 bg-card rounded-xl border p-5 space-y-4">
          <div className="flex items-center justify-between gap-3"><h2 className="font-semibold">Edit Admin: {editingDetailsAdmin.username}</h2><button type="button" onClick={() => setEditingDetailsAdmin(null)} className="border rounded-lg px-3 py-2 text-sm">Close</button></div>
          <form onSubmit={saveAdminDetails} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <label className="text-sm">First name<input required maxLength={50} value={editingDetails.firstName} onChange={e=>setEditingDetails({...editingDetails,firstName:e.target.value})} className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2" /></label>
            <label className="text-sm">Last name<input required maxLength={50} value={editingDetails.lastName} onChange={e=>setEditingDetails({...editingDetails,lastName:e.target.value})} className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2" /></label>
            <label className="text-sm">Username<input required minLength={3} maxLength={50} pattern="[A-Za-z0-9._-]+" autoComplete="off" value={editingDetails.username} onChange={e=>setEditingDetails({...editingDetails,username:e.target.value})} className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2" /></label>
            <label className="text-sm">Email<input type="email" value={editingDetails.email} onChange={e=>setEditingDetails({...editingDetails,email:e.target.value})} className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2" /></label>
             <label className="text-sm">New password (leave blank to keep current)
               <div className="relative mt-1">
                 <input type={showEditPassword ? "text" : "password"} minLength={4} maxLength={128} autoComplete="new-password" value={editingDetails.password} onChange={e=>setEditingDetails({...editingDetails,password:e.target.value})} className="border-border bg-background w-full rounded-md border px-3 py-2 pr-10" />
                 <button type="button" onClick={() => setShowEditPassword((shown) => !shown)} aria-label={showEditPassword ? "Hide password" : "Show password"} aria-pressed={showEditPassword} className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex items-center px-3">
                   {showEditPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                 </button>
               </div>
             </label>
            <div className="flex items-end"><button disabled={saving} className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm disabled:opacity-50">{saving ? "Saving..." : "Save Admin details"}</button></div>
          </form>
        </section>
      )}

      {editing && (
        <section className="border-primary/30 bg-card rounded-xl border p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-foreground font-semibold">
                Module access: {editing.firstName} {editing.lastName}
              </h2>
              <p className="text-muted-foreground text-sm">@{editing.username}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="border-border text-foreground rounded-lg border px-3 py-2 text-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={saveModules}
                disabled={saving}
                className="bg-primary text-primary-foreground rounded-lg px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save modules"}
              </button>
            </div>
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {MODULE_KEYS.map((module) => (
              <label key={module} className="text-muted-foreground flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editingModules.includes(module)}
                  onChange={() => toggleEditingModule(module)}
                />
                {formatModule(module)}
              </label>
            ))}
          </div>
        </section>
      )}

      <section className="border-border/60 bg-card overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Admin</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Workspace data</th>
              <th className="px-4 py-3 font-medium">Modules</th>
              <th className="px-4 py-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-border/60 divide-y">
            {loading ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6 text-center">
                  Loading workspaces...
                </td>
              </tr>
            ) : admins.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-muted-foreground px-4 py-6 text-center">
                  No Admin workspaces found.
                </td>
              </tr>
            ) : (
              admins.map((admin) => (
                <tr key={admin.id}>
                  <td className="px-4 py-3">
                    <p className="text-foreground font-medium">
                      {admin.firstName} {admin.lastName}
                    </p>
                    <p className="text-muted-foreground">@{admin.username}</p>
                  </td>
                  <td className="px-4 py-3 capitalize">{admin.status}</td>
                  <td className="text-muted-foreground px-4 py-3">
                    {admin.userCount} users · {admin.companyCount} companies
                    <br />
                    {admin.invoiceCount} invoices · {admin.purchaseCount} purchases
                  </td>
                  <td className="text-muted-foreground max-w-56 px-4 py-3">
                    {admin.modules.map(formatModule).join(", ") || "No modules"}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/superadmin/admins/${admin.id}`}
                        className="text-primary hover:bg-primary/5 rounded-md px-2 py-1 font-medium"
                      >
                        View workspace
                      </Link>
                      <button type="button" onClick={() => startEdit(admin)} className="text-primary hover:bg-primary/5 rounded-md px-2 py-1 font-medium">Edit</button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingDetailsAdmin(null);
                          setEditing(admin);
                          setEditingModules(admin.modules.filter((module): module is ModuleKey => (MODULE_KEYS as readonly string[]).includes(module)));
                        }}
                        className="text-primary hover:bg-primary/5 rounded-md px-2 py-1 font-medium"
                      >
                        Modules
                      </button>
                      <button type="button" onClick={() => { setDeleting(admin); setDeleteConfirmation(""); }} className="text-destructive rounded-md px-2 py-1 font-medium">Delete</button>
                      <button
                        type="button"
                        onClick={() => void changeStatus(admin)}
                        className="text-destructive hover:bg-destructive/5 rounded-md px-2 py-1 font-medium"
                      >
                        {admin.status === "active" ? "Deactivate" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </section>

      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <section role="dialog" aria-modal="true" aria-labelledby="delete-admin-title" className="bg-card w-full max-w-lg rounded-xl border p-6 shadow-xl">
            <h2 id="delete-admin-title" className="text-lg font-semibold text-destructive">Permanently delete Admin workspace?</h2>
            <p className="mt-2 text-sm">This permanently deletes <strong>@{deleting.username}</strong>, all users in this workspace, and its companies, invoices, purchases, vendors, purchase orders, delivery challans, referrals, settings, and history. This cannot be undone.</p>
            <label className="mt-4 block text-sm">Type <strong>{deleting.username}</strong> to confirm<input value={deleteConfirmation} onChange={e=>setDeleteConfirmation(e.target.value)} className="border-border bg-background mt-1 w-full rounded-md border px-3 py-2" /></label>
            <div className="mt-5 flex justify-end gap-2"><button type="button" onClick={()=>{setDeleting(null);setDeleteConfirmation("");}} className="border rounded-lg px-3 py-2 text-sm">Cancel</button><button type="button" disabled={saving || deleteConfirmation !== deleting.username} onClick={()=>void deleteAdmin()} className="bg-destructive text-white rounded-lg px-3 py-2 text-sm disabled:opacity-40">{saving ? "Deleting..." : "Permanently delete"}</button></div>
          </section>
        </div>
      )}
    </>
  );
}
