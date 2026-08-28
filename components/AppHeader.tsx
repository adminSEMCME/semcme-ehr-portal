"use client";

import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  focusFirstDescendant,
  handleDropdownKeyDown,
} from "@/lib/keyboardNavigation";
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
      <Link
        href="/"
        className="flex justify-center lg:justify-start"
        title="go to homepage"
      >
        <div className="bg-white rounded-md shadow-sm px-3 py-2 hover:bg-gray-300 transition">
          <div className="relative w-[170px] h-[45px]">
            <Image
              src="/logos/semcmeLogo.png"
              alt="SEMCME Logo"
              fill
              className="object-contain rounded-md"
              priority
              unoptimized
            />
          </div>
        </div>
      </Link>

      {/* RIGHT SIDE */}
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 sm:gap-5 lg:mt-0 lg:justify-end">
        {variant === "home" ? (
          <>
            <Link
              href="/about-authors"
              title="About The Authors"
              className="text-white font-semibold text-md hover:underline transition"
            >
              About The Authors
            </Link>

            <Link
              href="/demo"
              title="Open the User Guide and demo"
              className="text-md font-semibold text-white transition hover:underline"
            >
              User Guide
            </Link>

            <div ref={guidesRef} className="relative cursor-pointer">
              <Button
                onClick={() => setGuidesOpen((prev) => !prev)}
                onKeyDown={(e) => {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setGuidesOpen(true);
                    focusFirstDescendant(
                      guidesRef.current,
                      "[data-dropdown-menu]",
                    );
                  }
                }}
                variant="ghostInverted"
                title="View educator information and module previews"
                className="font-semibold text-md hover:underline"
              >
                For Educators
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    guidesOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {guidesOpen && (
                <div
                  data-dropdown-menu
                  className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-md bg-white py-1 shadow-xl ring-1 ring-slate-200"
                  onKeyDown={(e) =>
                    handleDropdownKeyDown(e, () => setGuidesOpen(false))
                  }
                >
                  <Link
                    href="/instructor-guide"
                    className="block px-4 py-3 text-sm font-semibold text-semcmeBlue hover:bg-blue-50"
                    title="Educator information"
                  >
                    Educator Information
                  </Link>
                  <Link
                    href="/educator-preview/ume"
                    className="block border-t border-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-semcmeBlue"
                    title="Preview UME modules"
                  >
                    Preview UME Modules
                  </Link>
                  <Link
                    href="/educator-preview/gme"
                    className="block border-t border-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-semcmeBlue"
                    title="Preview GME modules"
                  >
                    Preview GME Modules
                  </Link>
                  <Link
                    href="/educator-preview/cme"
                    className="block border-t border-slate-100 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-semcmeBlue"
                    title="Preview CME modules"
                  >
                    Preview CME Modules
                  </Link>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {/* 🔹 STANDARD ACTIONS */}
            {action === "back" && (
              <Button
                onClick={() =>
                  window.history.length > 1 ? router.back() : router.push("/")
                }
                variant="subtle"
                size="md"
                title="Go back to previous page"
                className="font-semibold"
              >
                <ArrowLeft size={18} /> Back
              </Button>
            )}

            {action === "register" && (
              <div className="flex items-center gap-4">
                <Button
                  asChild
                  variant="subtle"
                  size="md"
                  className="font-semibold"
                >
                  <Link href="/register" title="Go to registration page">
                    Register
                  </Link>
                </Button>
                <Button
                  onClick={() =>
                    window.history.length > 1 ? router.back() : router.push("/")
                  }
                  variant="subtle"
                  size="md"
                  title="Go back to previous page"
                  className="font-semibold"
                >
                  <ArrowLeft size={18} /> Back
                </Button>
              </div>
            )}

            {action === "logout" && (
              <form action="/api/logout" method="post">
                <Button
                  type="submit"
                  className="font-semibold shadow"
                  title="Log out of your account"
                  variant="destructive"
                  size="md"
                >
                  Log Out
                </Button>
              </form>
            )}
          </>
        )}
      </div>
    </header>
  );
}
