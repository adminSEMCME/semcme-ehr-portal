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
    <>
      <SessionWatcher timeoutMinutes={30} />
      {children}
    </>
  );
}
