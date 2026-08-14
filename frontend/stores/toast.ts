import { create } from "zustand";

export type ToastVariant = "success" | "error";

export type Toast = {
  id: string;
  message: string;
  variant: ToastVariant;
};

type ToastState = {
  toasts: Toast[];
  push: (message: string, variant?: ToastVariant) => void;
  dismiss: (id: string) => void;
};

let idCounter = 0;

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  push: (message, variant = "success") => {
    const id = `toast-${++idCounter}`;
    set((state) => ({ toasts: [...state.toasts, { id, message, variant }] }));
    setTimeout(
      () =>
        set((state) => ({
          toasts: state.toasts.filter((toast) => toast.id !== id),
        })),
      5000,
    );
  },
  dismiss: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((toast) => toast.id !== id),
    })),
}));
