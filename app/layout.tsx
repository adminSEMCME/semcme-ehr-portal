import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";
import "@fontsource/lato/400.css";
import "@fontsource/lato/700.css";
import { GlobalToast } from "@/components/GlobalToast";

export const metadata: Metadata = {
  title: "SEMCME EHR Learning Portal",
  description:
    "Electronic Health Record learning modules for CME and Non-CME participants.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased text-gray-900 min-h-screen overflow-x-hidden">
        {/* === Pinned Logo === */}
        <Link
          href="/"
          className="fixed top-0 left-0 z-50 flex items-center hover:opacity-80 transition-opacity"
        >
          <div className="relative w-[200px] h-[50px]">
            <Image
              src="/logos/semcme_logo.jpg"
              alt="SEMCME Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
        </Link>

        {/* === Main Content === */}
        <main className="relative z-10 w-full max-w-none">{children}</main>

        {/* === Toast Notifications === */}
        <GlobalToast />
      </body>
    </html>
  );
}
