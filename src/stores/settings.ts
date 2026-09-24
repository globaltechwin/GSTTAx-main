import { create } from "zustand";

export type SettingsCategory =
  | "general"
  | "company"
  | "billing"
  | "invoice"
  | "gst-tax"
  | "notifications"
  | "printing"
  | "users-roles"
  | "security"
  | "backup-restore"
  | "appearance"
  | "integrations"
  | "system-preferences";

interface SettingsState {
  activeCategory: SettingsCategory;
  hasUnsavedChanges: boolean;
  setActiveCategory: (category: SettingsCategory) => void;
  setHasUnsavedChanges: (value: boolean) => void;
}

export const useSettingsStore = create<SettingsState>((set) => ({
  activeCategory: "general",
  hasUnsavedChanges: false,
  setActiveCategory: (category) => set({ activeCategory: category }),
  setHasUnsavedChanges: (value) => set({ hasUnsavedChanges: value }),
}));
