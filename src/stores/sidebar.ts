import { create } from "zustand";

interface SidebarStore {
  isCollapsed: boolean;
  toggle: () => void;
  setCollapsed: (value: boolean) => void;
}

export const useSidebarStore = create<SidebarStore>((set) => ({
  isCollapsed: false,
  toggle: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
  setCollapsed: (value) => set({ isCollapsed: value }),
}));
