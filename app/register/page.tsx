"use client";

import { Suspense } from "react";
import RegisterClient from "./RegisterClient";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <RegisterClient />
    </Suspense>
  );
}
