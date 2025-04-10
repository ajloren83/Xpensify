"use client";

import * as React from "react";
import { useToast } from "@/hooks/use-toast";
import { Toast } from "./toast";
import { cn } from "@/lib/utils";

export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <div
      className={cn(
        "fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]"
      )}
    >
      {toasts.map(({ id, ...props }) => (
        <Toast
          key={id}
          {...props}
          onClose={() => dismiss(id)}
        />
      ))}
    </div>
  );
} 