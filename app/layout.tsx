import type { Metadata } from "next";
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
      <body className="font-sans antialiased bg-background text-foreground">
        {children}
        <GlobalToast />
      </body>
    </html>
  );
}
