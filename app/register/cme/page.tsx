import { Suspense } from "react";
import CmeClient from "./CmeClient";

export default function CmePage() {
  return (
    <Suspense>
      <CmeClient />
    </Suspense>
  );
}
