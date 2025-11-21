"use client";

import { useEffect, useMemo, useState } from "react";
import React from "react";

type UserModuleRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  institution: string | null;
  user_created_at: string | null;
  module_id: string | null;
  module_title: string | null;
  order_index: number | null;
  status: string | null;
  progress_percent: number | null;
  date_started: string | null;
  date_completed: string | null;
  last_accessed: string | null;
  cert_url: string | null;
  cert_issued_at: string | null;
};

type AnalyticsResponse = {
  userModules: UserModuleRow[];
};

type UserSummary = {
  user_id: string;
  name: string;
  email: string;
  institution: string;
  createdAt: string | null;
  completedCount: number;
  inProgressCount: number;
  modules: UserModuleRow[];
};

type ModuleSummary = {
  module_id: string;
  title: string;
  attempts: number;
  completions: number;
  avgProgress: number;
  order_index: number | null;
};

type InstitutionSummary = {
  institution: string;
  userCount: number;
  totalCompletions: number;
  perModule: Record<string, number>;
};

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<"users" | "modules" | "institutions">("users");

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);

  const [filterModuleId, setFilterModuleId] = useState<string | "all">("all");
  const [filterInstitution, setFilterInstitution] = useState<string | "all">(
    "all"
  );

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) {
          setAnalytics({ userModules: [] });
          return;
        }
        const data = (await res.json()) as AnalyticsResponse;
        setAnalytics(data);
      } catch {
        setAnalytics({ userModules: [] });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const {
    users,
    modules,
    institutions,
    kpis,
    moduleOptions,
    institutionOptions,
  } = useMemo(() => {
    const userModules = analytics?.userModules ?? [];

    const usersMap = new Map<string, UserSummary>();
    const moduleMap = new Map<string, ModuleSummary>();
    const institutionMap = new Map<string, InstitutionSummary>();

    // Build users
    for (const row of userModules) {
      const id = row.user_id;
      if (!id) continue;

      const name =
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unnamed";
      const institution = row.institution ?? "";
      const createdAt = row.user_created_at ?? null;

      if (!usersMap.has(id)) {
        usersMap.set(id, {
          user_id: id,
          name,
          email: row.email,
          institution,
          createdAt,
          completedCount: 0,
          inProgressCount: 0,
          modules: [],
        });
      }

      const u = usersMap.get(id)!;

      if (row.module_id) {
        u.modules.push(row);
        if (row.status === "completed") u.completedCount++;
        if (row.status === "in_progress") u.inProgressCount++;
      }
    }

    // Build modules
    for (const row of userModules) {
      if (!row.module_id || !row.module_title) continue;

      if (!moduleMap.has(row.module_id)) {
        moduleMap.set(row.module_id, {
          module_id: row.module_id,
          title: row.module_title,
          attempts: 0,
          completions: 0,
          avgProgress: 0,
          order_index: row.order_index ?? 0,
        });
      }

      const m = moduleMap.get(row.module_id)!;

      if (row.status) m.attempts++;
      if (row.status === "completed") m.completions++;

      if (typeof row.progress_percent === "number") {
        (m as any)._sum = ((m as any)._sum ?? 0) + row.progress_percent;
        (m as any)._count = ((m as any)._count ?? 0) + 1;
      }
    }

    moduleMap.forEach((m) => {
      const sum = (m as any)._sum ?? 0;
      const count = (m as any)._count ?? 0;
      m.avgProgress = count ? Math.round(sum / count) : 0;
    });

    // Institutions
    for (const [, u] of usersMap) {
      const inst = u.institution.trim() || "Unknown";

      if (!institutionMap.has(inst)) {
        institutionMap.set(inst, {
          institution: inst,
          userCount: 0,
          totalCompletions: 0,
          perModule: {},
        });
      }

      const entry = institutionMap.get(inst)!;
      entry.userCount++;

      for (const m of u.modules) {
        if (m.status === "completed" && m.module_id) {
          entry.totalCompletions++;
          entry.perModule[m.module_id] =
            (entry.perModule[m.module_id] ?? 0) + 1;
        }
      }
    }

    const kpiUsers = usersMap.size;
    const kpiCompletions = Array.from(usersMap.values()).reduce(
      (sum, u) => sum + u.completedCount,
      0
    );

    const avgProgress = (() => {
      let sum = 0,
        count = 0;
      for (const u of usersMap.values()) {
        for (const m of u.modules) {
          if (m.progress_percent != null) {
            sum += m.progress_percent;
            count++;
          }
        }
      }
      return count ? Math.round(sum / count) : 0;
    })();

    return {
      users: Array.from(usersMap.values()),
      modules: Array.from(moduleMap.values()).sort(
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0)
      ),
      institutions: Array.from(institutionMap.values()),
      kpis: {
        totalUsers: kpiUsers,
        totalCompletions: kpiCompletions,
        avgProgress,
      },
      moduleOptions: Array.from(moduleMap.values()).map((m) => ({
        value: m.module_id,
        label: m.title,
      })),
      institutionOptions: Array.from(institutionMap.values()).map((i) => ({
        value: i.institution,
        label: i.institution,
      })),
    };
  }, [analytics]);

  // Filter users
  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (filterInstitution !== "all") {
      list = list.filter((u) =>
        u.institution.toLowerCase().includes(filterInstitution.toLowerCase())
      );
    }

    if (filterModuleId !== "all") {
      list = list.filter((u) =>
        u.modules.some((m) => m.module_id === filterModuleId)
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.institution.toLowerCase().includes(q)
      );
    }

    return list;
  }, [users, search, filterInstitution, filterModuleId]);

  if (loading)
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-semcmeBlue">Admin Dashboard</h1>
        <p className="text-gray-500">Loading…</p>
      </div>
    );

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-semcmeBlue text-center">
        Admin Dashboard
      </h1>

      {/* KPIs */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Users" value={kpis.totalUsers} />
        <KpiCard
          label="Total Module Completions"
          value={kpis.totalCompletions}
        />
        <KpiCard label="Avg Progress %" value={`${kpis.avgProgress}%`} />
      </section>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        {["users", "modules", "institutions"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              tab === t
                ? "bg-semcmeBlue text-white border-semcmeBlue"
                : "bg-white text-semcmeBlue border-semcmeBlue/40"
            }`}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* USERS TABLE */}
      {tab === "users" && (
        <>
          <p className="text-center text-sm text-gray-500 mb-1">
            Click a user row to expand their full module history.
          </p>

          <section className="flex flex-wrap gap-3 items-center justify-center">
            <input
              placeholder="Search users…"
              className="px-4 py-2 rounded-lg border w-full sm:w-80"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterModuleId}
              onChange={(e) =>
                setFilterModuleId(
                  e.target.value === "all" ? "all" : e.target.value
                )
              }
              className="px-3 py-2 rounded-lg border"
            >
              <option value="all">All modules</option>
              {moduleOptions.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={filterInstitution}
              onChange={(e) =>
                setFilterInstitution(
                  e.target.value === "all" ? "all" : e.target.value
                )
              }
              className="px-3 py-2 rounded-lg border"
            >
              <option value="all">All institutions</option>
              {institutionOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>
          </section>

          {/* TABLE */}
          <div className="overflow-x-auto border rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-semcmeBlue text-white">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Institution</th>
                  <th className="p-3 text-left">Completed</th>
                  <th className="p-3 text-left">In Progress</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <React.Fragment key={u.user_id}>
                    <tr
                      onClick={() =>
                        setSelectedUserId(
                          selectedUserId === u.user_id ? null : u.user_id
                        )
                      }
                      className="border-b hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.institution}</td>
                      <td className="p-3">{u.completedCount}</td>
                      <td className="p-3">{u.inProgressCount}</td>
                    </tr>

                    {selectedUserId === u.user_id && (
                      <tr className="bg-gray-50 border-b">
                        <td colSpan={5} className="p-4">
                          <UserDetailPanel user={u} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* MODULES */}
      {tab === "modules" && (
        <section className="overflow-x-auto border rounded-xl shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-semcmeBlue text-white">
              <tr>
                <th className="p-3 text-left">Module</th>
                <th className="p-3 text-left">Attempts</th>
                <th className="p-3 text-left">Completions</th>
                <th className="p-3 text-left">Avg Progress</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m) => (
                <tr key={m.module_id} className="border-b hover:bg-gray-100">
                  <td className="p-3">{m.title}</td>
                  <td className="p-3">{m.attempts}</td>
                  <td className="p-3">{m.completions}</td>
                  <td className="p-3">{m.avgProgress}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* INSTITUTIONS */}
      {tab === "institutions" && (
        <section className="overflow-x-auto border rounded-xl shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-semcmeBlue text-white">
              <tr>
                <th className="p-3 text-left">Institution</th>
                <th className="p-3 text-left">Users</th>
                <th className="p-3 text-left">Total Completions</th>
              </tr>
            </thead>
            <tbody>
              {institutions.map((i) => (
                <tr key={i.institution} className="border-b hover:bg-gray-100">
                  <td className="p-3">{i.institution}</td>
                  <td className="p-3">{i.userCount}</td>
                  <td className="p-3">{i.totalCompletions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-4 text-center">
      <div className="text-xs uppercase text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-semcmeBlue">{value}</div>
    </div>
  );
}

function UserDetailPanel({ user }: { user: UserSummary }) {
  const completed = user.modules.filter((m) => m.status === "completed");
  const inProgress = user.modules.filter((m) => m.status === "in_progress");

  return (
    <div className="space-y-3 text-sm text-gray-700">
      <h2 className="text-xl font-semibold text-semcmeBlue">{user.name}</h2>

      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Institution:</strong> {user.institution}
      </p>
      <p>
        <strong>Account Created:</strong>{" "}
        {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : "—"}
      </p>

      <p>
        <strong>Total Modules Completed:</strong> {user.completedCount}
      </p>

      <div>
        <h3 className="font-semibold text-gray-800">Completed Modules</h3>
        {completed.length === 0 ? (
          <p className="text-xs text-gray-500">None completed.</p>
        ) : (
          <ul className="text-xs">
            {completed.map((m, idx) => (
              <li key={idx}>
                <strong>{m.module_title ?? m.module_id}</strong> —{" "}
                {m.date_completed
                  ? new Date(m.date_completed).toLocaleDateString()
                  : "date unknown"}
                {m.cert_url && (
                  <>
                    {" "}
                    •{" "}
                    <a
                      href={m.cert_url}
                      target="_blank"
                      className="text-semcmeBlue underline"
                    >
                      Certificate
                    </a>
                  </>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h3 className="font-semibold text-gray-800">Modules In Progress</h3>
        {inProgress.length === 0 ? (
          <p className="text-xs text-gray-500">None.</p>
        ) : (
          <ul className="text-xs">
            {inProgress.map((m, idx) => (
              <li key={idx}>
                <strong>{m.module_title ?? m.module_id}</strong> —{" "}
                {m.progress_percent ?? 0}% complete
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
