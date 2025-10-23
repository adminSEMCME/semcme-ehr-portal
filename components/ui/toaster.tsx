"use client";

import { useState } from "react";
import { Toast } from "./toast";

export function Toaster() {
  const [toasts, setToasts] = useState<
    { title: string; description?: string }[]
  >([]);

  // Custom trigger for toasts (optional)
  if (typeof window !== "undefined") {
    (window as any).showToast = (title: string, description?: string) => {
      setToasts((prev) => [...prev, { title, description }]);
      setTimeout(() => setToasts((prev) => prev.slice(1)), 4000);
    };
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2">
      {toasts.map((toast, i) => (
        <Toast key={i} title={toast.title} description={toast.description} />
      ))}
    </div>
  );
}
