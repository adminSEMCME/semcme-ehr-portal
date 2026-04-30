//app/reset-password/page.tsx

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { Eye, EyeOff } from "lucide-react";
import AppHeader from "@/components/AppHeader";
import { Button } from "@/components/ui/button";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [setting, setSetting] = useState(false);
  const [ready, setReady] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  // 👁️ Password visibility toggles
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const init = async () => {
      // First check if session already exists
      const { data } = await supabase.auth.getSession();

      if (data.session) {
        setReady(true);
      }

      // Listen for recovery OR sign in
      const { data: listener } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
            if (session) {
              setReady(true);
            }
          }
        },
      );

      return () => {
        listener.subscription.unsubscribe();
      };
    };

    init();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (newPassword.length < 8) {
      setErrorMsg("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirm) {
      setErrorMsg("Passwords do not match.");
      return;
    }

    setSetting(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg("Could not update your password. Please try again.");
    } finally {
      setSetting(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-transparent font-sans">
      <AppHeader action="back" />
      <div className="bg-white p-8 md:p-10 rounded-2xl shadow-md w-full max-w-md">
        <h1 className="text-3xl font-bold text-semcmeBlue mb-6 text-center">
          Reset your password
        </h1>

        {!ready ? (
          <p className="text-center text-gray-700">
            This reset link is invalid or has expired. Please{" "}
            <a
              href="/forgot-password"
              className="text-semcmeBlue font-semibold hover:underline"
            >
              request a new password reset
            </a>
            .
          </p>
        ) : done ? (
          <div className="text-center space-y-4">
            <p className="text-gray-700 font-medium">
              ✅ Your password has been updated.
            </p>
            <p className="text-sm text-gray-500">Redirecting you to sign in…</p>
          </div>
        ) : (
          <form onSubmit={handleUpdate} className="space-y-4">
            {/* === New Password === */}
            <div className="relative">
              <input
                required
                type={showNew ? "text" : "password"}
                placeholder="New Password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="border p-3 rounded-lg w-full pr-10"
              />
              <Button
                type="button"
                onClick={() => setShowNew(!showNew)}
                variant="ghost"
                size="icon-sm"
                className="absolute inset-y-1 right-2 text-gray-500 hover:text-semcmeBlue"
                aria-label={showNew ? "Hide password" : "Show password"}
              >
                {showNew ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>

            {/* === Confirm Password === */}
            <div className="relative">
              <input
                required
                type={showConfirm ? "text" : "password"}
                placeholder="Confirm New Password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className="border p-3 rounded-lg w-full pr-10"
              />
              <Button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                variant="ghost"
                size="icon-sm"
                className="absolute inset-y-1 right-2 text-gray-500 hover:text-semcmeBlue"
                aria-label={showConfirm ? "Hide password" : "Show password"}
              >
                {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
              </Button>
            </div>

            {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}

            <Button
              type="submit"
              disabled={setting}
              size="xl"
              className="w-full font-semibold"
            >
              {setting ? "Updating..." : "Update Password"}
            </Button>
          </form>
        )}
      </div>
    </main>
  );
}
