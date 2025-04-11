"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Toast,
  ToastClose,
  ToastProvider,
  ToastViewport,
  ToastType
} from "./toast";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  // Set up auto-dismiss for toasts with duration
  React.useEffect(() => {
    toasts.forEach((toast) => {
      if (toast.duration && toast.open) {
        const timer = setTimeout(() => {
          dismiss(toast.id);
        }, toast.duration);
        
        // Cleanup timer on unmount or when toast changes
        return () => clearTimeout(timer);
      }
    });
  }, [toasts, dismiss]);

  // Helper function to determine toast type based on variant
  const getToastType = (variant: string | undefined): ToastType => {
    switch (variant) {
      case "destructive":
        return "error";
      case "success":
        return "success";
      case "warning":
        return "warning";
      case "info":
        return "info";
      default:
        return "default";
    }
  };

  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, variant, ...props }) => {
        // Ensure variant is a string before passing to getToastType
        const variantStr = typeof variant === 'string' ? variant : undefined;
        
        return (
          <Toast 
            key={id} 
            variant={variant}
            toastType={getToastType(variantStr)}
            title={title}
            description={description}
            action={action}
            {...props}
          >
            <ToastClose onClick={() => dismiss(id)} />
          </Toast>
        );
      })}
      <ToastViewport />
    </ToastProvider>
  );
}