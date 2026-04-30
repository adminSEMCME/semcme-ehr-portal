"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const toastVariants = cva(
  // Full-screen semi-transparent overlay with centered content
  "fixed inset-0 z-[1000] flex items-center justify-center bg-black/50"
);

export interface ToastProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof toastVariants> {
  title?: string;
  description?: string;
  onClose?: () => void;
}

export function Toast({
  title,
  description,
  className,
  onClose,
  ...props
}: ToastProps) {
  return (
    <div className={cn(toastVariants(), className)} {...props}>
      <div className="w-[90%] max-w-md rounded-2xl bg-white p-6 shadow-2xl flex flex-col items-center text-center">
        {title && (
          <h3 className="text-xl font-semibold text-semcmeBlue">{title}</h3>
        )}

        {description && (
          <p className="mt-2 text-gray-700 leading-relaxed">{description}</p>
        )}

        <Button
          onClick={onClose}
          size="md"
          className="mt-6 rounded-lg font-medium hover:bg-[#034f8c]"
        >
          OK
        </Button>
      </div>
    </div>
  );
}
