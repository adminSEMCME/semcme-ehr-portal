"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface SessionWatcherProps {
  timeoutMinutes?: number;
}

export default function SessionWatcher({
  timeoutMinutes = 30,
}: SessionWatcherProps) {
  const router = useRouter();

  useEffect(() => {
    let inactivityTimer: NodeJS.Timeout;
    let isLoggingOut = false; // Prevent duplicate logout calls

    // 🔒 Logs the user out through the API
    const performLogout = async (reason = "timeout") => {
      if (isLoggingOut) return; // Skip duplicate logout attempts
      isLoggingOut = true;

      try {
        await fetch(`/api/logout?reason=${reason}`, {
          method: "POST",
          keepalive: true, // ensures it runs even during tab close
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        console.error("Error calling /api/logout:", error);
      } finally {
        router.push("/login");
      }
    };

    // 🕒 Timer that logs the user out after inactivity
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(
        () => performLogout("timeout"),
        timeoutMinutes * 60 * 1000
      );
    };

    // 🖱️ User actions that reset the inactivity timer
    const events = ["mousemove", "keydown", "click", "scroll"];
    events.forEach((event) => window.addEventListener(event, resetTimer));

    // 🚪 Fires when the user closes the tab or browser
    const handleUnload = () => {
      try {
        const blob = new Blob([], { type: "application/json" });
        navigator.sendBeacon("/api/logout?reason=tab_close", blob);
      } catch (err) {
        console.warn("Tab close logout failed silently:", err);
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    // Start timer when component mounts
    resetTimer();

    // 🧹 Cleanup listeners when unmounted
    return () => {
      clearTimeout(inactivityTimer);
      events.forEach((event) => window.removeEventListener(event, resetTimer));
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [router, timeoutMinutes]);

  return null;
}
