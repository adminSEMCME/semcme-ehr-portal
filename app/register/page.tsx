"use client";

import { Suspense } from "react";
import RegisterClient from "./RegisterClient";
import Footer from "../../components/Footer";

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <RegisterClient />
      <Footer />
    </Suspense>
  );
}
