import type { Metadata } from "next";
import "./globals.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import { GlobalToast } from "@/components/GlobalToast";

export const metadata: Metadata = {
  title: "SEMCME EHR Learning Portal",
  description:
    "Electronic Health Record learning modules for CE and Non-CE participants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 min-h-screen overflow-x-hidden">
        {/* === Main Content === */}
        <main className="relative z-10 w-full max-w-none">{children}</main>

        {/* === Toast Notifications === */}
        <GlobalToast />
      </body>
    </html>
  );
}
