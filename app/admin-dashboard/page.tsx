"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type AnyRow = Record<string, any>;

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<AnyRow[]>([]);
  const [progress, setProgress] = useState<AnyRow[]>([]);
  const [modules, setModules] = useState<AnyRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");

  useEffect(() => {
    async function loadData() {
      setLoading(true);

      const { data: userRows } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      const { data: progressRows } = await supabase
        .from("module_progress")
        .select("*");

      const { data: moduleRows } = await supabase
        .from("modules")
        .select("*")
        .order("order_index", { ascending: true });

      setUsers((userRows as AnyRow[]) || []);
      setProgress((progressRows as AnyRow[]) || []);
      setModules((moduleRows as AnyRow[]) || []);

      setLoading(false);
    }

    loadData();
  }, []);

  const filteredUsers = users.filter((u) =>
    `${u.firstName} ${u.lastName} ${u.email}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 text-center">
      {/* TITLE */}
      <h1 className="text-4xl font-bold text-semcmeBlue">Admin Dashboard</h1>
      {/* SEARCH */}
        <input
          placeholder="Search users..."
          className="admin-dashboard-search px-4 py-2 rounded-lg w-80 text-gray-800"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      {/* ================= USERS TABLE ================= */}
      {!loading && (
        <>
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-semcmeBlue">Users</h2>

            <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-semcmeBlue text-white">
                  <tr>
                    <th className="p-3 text-left font-semibold">Name</th>
                    <th className="p-3 text-left font-semibold">Email</th>
                    <th className="p-3 text-left font-semibold">Institution</th>
                    <th className="p-3 text-left font-semibold">Role</th>
                    <th className="p-3 text-left font-semibold">Created</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b hover:bg-gray-100 text-gray-800"
                    >
                      <td className="p-3">
                        {u.firstName} {u.lastName}
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.institution}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString()
                          : ""}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= MODULE PROGRESS TABLE ================= */}
          <section>
            <h2 className="text-2xl font-semibold mb-4 text-semcmeBlue">Module Progress</h2>

            <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
              <table className="min-w-full text-sm">
                <thead className="bg-semcmeBlue text-white">
                  <tr>
                    <th className="p-3 text-left font-semibold">User ID</th>
                    <th className="p-3 text-left font-semibold">Module</th>
                    <th className="p-3 text-left font-semibold">Status</th>
                    <th className="p-3 text-left font-semibold">Progress %</th>
                  </tr>
                </thead>

                <tbody>
                  {progress.map((p) => {
                    const module = modules.find((m) => m.id === p.module_id) as
                      | AnyRow
                      | undefined;

                    return (
                      <tr
                        key={`${p.user_id}-${p.module_id}`}
                        className="border-b hover:bg-gray-100 text-gray-800"
                      >
                        <td className="p-3">{p.user_id}</td>
                        <td className="p-3">
                          {module ? module.title : p.module_id}
                        </td>
                        <td className="p-3">{p.status}</td>
                        <td className="p-3">{p.progress_percent ?? 0}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
      {loading && <p className="text-gray-600">Loading data…</p>}
    </div>
  );
}
