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
            />
          </div>
        </div>
      </Link>

      {/* RIGHT SIDE */}
      <div className="flex items-center gap-6 justify-center lg:justify-end mt-3 lg:mt-0">
        {variant === "home" ? (
          <>
            <Link
              href="/about-authors"
              title="About The Authors"
              className="text-white font-semibold text-md hover:underline transition"
            >
              About The Authors
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
                title="view website guides"
                className="font-semibold text-md hover:underline"
              >
                Website Guides
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${
                    guidesOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {guidesOpen && (
                <div
                  data-dropdown-menu
                  className="absolute right-0 top-full mt-2 bg-white rounded-sm shadow-lg w-34 overflow-hidden z-50"
                  onKeyDown={(e) =>
                    handleDropdownKeyDown(e, () => setGuidesOpen(false))
                  }
                >
                  <a
                    href="/demo"
                    title="User Guide"
                    target="_self"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-semcmeBlue hover:bg-slate-200"
                  >
                    User Guide
                  </a>

                  <a
                    href="/pdfs/instructor-guide.pdf"
                    target="_self"
                    rel="noopener noreferrer"
                    className="block px-4 py-2 text-sm text-semcmeBlue hover:bg-slate-200"
                    title="Instructor Guide"
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
