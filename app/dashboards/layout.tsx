import { protectRoute } from "@/lib/protectRoute";
import SessionWatcher from "@/components/SessionWatcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 🔒 Protect every page inside /dashboard (CME + Non-CME)
  await protectRoute();

  return (
    <main className="min-h-screen bg-gray-50 font-sans flex flex-col items-center justify-start">
      {/* 🕒 Auto logout after inactivity */}
      <SessionWatcher timeoutMinutes={30} />

      {/* Page-specific content renders here */}
      {children}
    </main>
  );
}
