import { Suspense } from "react";
import NonCmeClient from "./NonCmeClient";

export default function NonCmePage() {
  return (
    <Suspense>
      <NonCmeClient />
    </Suspense>
  );
}
