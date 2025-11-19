"use client";

import { Suspense } from "react";
import ChooseClient from "./choose-client";

export default function ChooseRegistrationPage() {
  return (
    <Suspense fallback={<div className="text-white p-10">Loading...</div>}>
      <ChooseClient />
    </Suspense>
  );
}
