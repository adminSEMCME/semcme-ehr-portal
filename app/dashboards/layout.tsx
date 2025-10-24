// app/dashboards/layout.tsx
import { protectRoute } from "@/lib/protectRoute";
import SessionWatcher from "@/components/SessionWatcher";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await protectRoute();

  return (
    <main className="min-h-screen bg-gray-50 font-sans flex flex-col items-center justify-start">
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </main>
  );
}
