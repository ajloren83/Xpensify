"use client";

import * as React from "react"

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider as RadixToastProvider,
  ToastTitle,
  ToastViewport,
  type ToastProps,
} from "@/components/ui/toast"
import { useToast } from "@/hooks/use-toast"

type ToasterToast = Omit<ToastProps, "title" | "description" | "action"> & {
  id: string
  title?: React.ReactNode
  description?: React.ReactNode
  action?: React.ReactElement
}

export function ToasterContext() {
  const { toasts } = useToast()

  return (
    <RadixToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }: ToasterToast) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </RadixToastProvider>
  )
}

interface Toast extends Omit<ToastProps, "id"> {
  id: string;
}

interface ToastContextValue {
  toasts: Toast[];
  addToast: (toast: Omit<Toast, "id">) => void;
  removeToast: (id: string) => void;
}

const ToastContext = React.createContext<ToastContextValue | undefined>(undefined);

export function ToastContextProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<Toast[]>([]);

  const addToast = React.useCallback((toast: Omit<Toast, "id">) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { ...toast, id }]);
  }, []);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = React.useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
} 