"use client";

import { useEffect, useState } from "react";
import { Toast } from "@/components/ui/toast";

export function GlobalToast() {
  const [toast, setToast] = useState<{
    title: string;
    description?: string;
  } | null>(null);

  useEffect(() => {
    (window as any).showToast = (title: string, description?: string) => {
      setToast({ title, description });
    };
    (window as any).hideToast = () => setToast(null);
  }, []);

  if (!toast) return null;

  return (
    <Toast
      title={toast.title}
      description={toast.description}
      onClose={() => (window as any).hideToast()}
    />
  );
}
