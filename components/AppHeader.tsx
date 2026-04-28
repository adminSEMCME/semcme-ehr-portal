"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useState, useRef, useEffect } from "react";

type HeaderVariant = "default" | "home";
type HeaderAction = "back" | "register" | "logout" | "none";

interface AppHeaderProps {
  variant?: HeaderVariant;
  action?: HeaderAction;
}

export default function AppHeader({
  variant = "default",
  action = "none",
}: AppHeaderProps) {
  const router = useRouter();

  const [guidesOpen, setGuidesOpen] = useState(false);
  const guidesRef = useRef<HTMLDivElement>(null);

  // close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (guidesRef.current && !guidesRef.current.contains(e.target as Node)) {
        setGuidesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="w-full flex flex-col lg:flex-row lg:items-center lg:justify-between px-4 py-3 relative z-50">
      {/* LOGO */}
      <Link href="/" className="flex justify-center lg:justify-start">
        <div className="bg-white rounded-md shadow-sm px-3 py-2 hover:bg-gray-300 transition">
          <div className="relative w-[170px] h-[45px]">
            <Image
              src="/logos/semcmeLogo.png"
              alt="SEMCME Logo"
              fill
              className="object-contain rounded-md"
              priority
            />
          </div>
        </div>
      </Link>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6 justify-center lg:justify-end mt-3 lg:mt-0">
        {/* 🔹 HOME NAV VARIANT */}
        {variant === "home" ? (
          <>
            <Link
              href="/about-authors"
              className="text-white font-semibold text-md hover:underline transition"
            >
              About The Authors
            </Link>

            <div ref={guidesRef} className="relative cursor-pointer">
              <button
                onClick={() => setGuidesOpen((prev) => !prev)}
                className="text-white font-semibold text-md flex items-center gap-1 hover:underline"
              >
                Website Guides
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    guidesOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {guidesOpen && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-sm shadow-lg w-48 overflow-hidden z-50">
                  <a
                    href="/demo"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-semcmeBlue hover:bg-slate-200"
                  >
                    User Guide
                  </a>

                  <a
                    href="/pdfs/instructor-guide.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-semcmeBlue hover:bg-slate-200"
                  >
                    Instructor Guide
                  </a>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 🔹 STANDARD ACTIONS */}
            {action === "back" && (
              <button
                onClick={() =>
                  window.history.length > 1 ? router.back() : router.push("/")
                }
                className="bg-white rounded-md shadow-sm px-4 py-2 flex items-center gap-2 text-semcmeBlue font-semibold hover:bg-slate-300 transition"
              >
                <ArrowLeft size={18} /> Back
              </button>
            )}

            {action === "register" && (
              <Button asChild variant="semcme">
                <Link href="/register">Register</Link>
              </Button>
            )}

            {action === "logout" && (
              <form action="/api/logout" method="post">
                <button
                  type="submit"
                  className="bg-red-500 text-white px-4 py-2 rounded-md shadow hover:bg-red-700 transition font-semibold h-10"
                >
                  Log Out
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </header>
  );
}
