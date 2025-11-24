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

type ModuleMeta = {
  id: string;
  title: string;
  order_index: number | null;
};

type AnalyticsResponse = {
  userModules: UserModuleRow[];
  modules: ModuleMeta[];
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

  usersCompleted: number;
  usersInProgress: number;
  usersNotStarted: number;
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
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(
    null
  );

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
          setAnalytics({ userModules: [], modules: [] });
          return;
        }
        const data = (await res.json()) as AnalyticsResponse;
        setAnalytics(data);
      } catch {
        setAnalytics({ userModules: [], modules: [] });
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
    allModules,
  } = useMemo(() => {
    const userModules = analytics?.userModules ?? [];
    const allModules: ModuleMeta[] = analytics?.modules ?? [];

    const usersMap = new Map<string, UserSummary>();
    const moduleMap = new Map<string, ModuleSummary>();
    const institutionMap = new Map<string, InstitutionSummary>();

    for (const mod of allModules) {
      moduleMap.set(mod.id, {
        module_id: mod.id,
        title: mod.title,
        attempts: 0,
        completions: 0,
        avgProgress: 0,
        order_index: mod.order_index ?? 0,

        usersCompleted: 0,
        usersInProgress: 0,
        usersNotStarted: 0,
      });
    }

    for (const row of userModules) {
      const id = row.user_id;
      if (!id) continue;

      const name =
        `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() || "Unnamed";

      if (!usersMap.has(id)) {
        usersMap.set(id, {
          user_id: id,
          name,
          email: row.email,
          institution: row.institution ?? "",
          createdAt: row.user_created_at ?? null,
          completedCount: 0,
          inProgressCount: 0,
          modules: [],
        });
      }

      const u = usersMap.get(id)!;

      if (row.module_id) {
        const m = moduleMap.get(row.module_id);

        // Skip rows that reference unknown modules
        if (!m) continue;

        u.modules.push(row);

        if (row.status === "completed") u.completedCount++;
        if (row.status === "in_progress") u.inProgressCount++;

        if (row.status === "completed") m.usersCompleted++;
        else if (row.status === "in_progress") m.usersInProgress++;
        else m.usersNotStarted++;

        if (row.status) m.attempts++;
        if (row.status === "completed") m.completions++;

        if (typeof row.progress_percent === "number") {
          (m as any)._sum = ((m as any)._sum ?? 0) + row.progress_percent;
          (m as any)._count = ((m as any)._count ?? 0) + 1;
        }
      }
    }

    for (const [, mod] of moduleMap) {
      const totalUsers = usersMap.size;
      const started = mod.usersCompleted + mod.usersInProgress;
      mod.usersNotStarted = totalUsers - started;

      const sum = (mod as any)._sum ?? 0;
      const count = (mod as any)._count ?? 0;
      mod.avgProgress = count ? Math.round(sum / count) : 0;
    }

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

      const i = institutionMap.get(inst)!;

      i.userCount++;

      for (const m of u.modules) {
        if (m.status === "completed" && m.module_id) {
          i.totalCompletions++;
          i.perModule[m.module_id] = (i.perModule[m.module_id] ?? 0) + 1;
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
      moduleOptions: allModules.map((m) => ({ value: m.id, label: m.title })),
      institutionOptions: Array.from(institutionMap.values()).map((i) => ({
        value: i.institution,
        label: i.institution,
      })),
      allModules,
    };
  }, [analytics]);

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

      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Users" value={kpis.totalUsers} />
        <KpiCard
          label="Total Module Completions"
          value={kpis.totalCompletions}
        />
        <KpiCard label="Avg Progress %" value={`${kpis.avgProgress}%`} />
      </section>

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

      {tab === "users" && (
        <>
          <p className="text-center text-sm text-gray-500 mb-1">
            Click a user row to expand their full module history.
          </p>

          <section className="flex flex-wrap gap-3 items-center justify-center">
            <input
              placeholder="Search by User/Email/Institution…"
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
                          <UserDetailPanel user={u} allModules={allModules} />
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

      {tab === "modules" && (
        <section className="overflow-x-auto border rounded-xl shadow-sm bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-semcmeBlue text-white">
              <tr>
                <th className="p-3 text-left">Module</th>
                <th className="p-3 text-left">Attempts</th>
                <th className="p-3 text-left">Completions</th>
              </tr>
            </thead>

            <tbody>
              {modules.map((m) => (
                <React.Fragment key={m.module_id}>
                  <tr
                    onClick={() =>
                      setSelectedModuleId(
                        selectedModuleId === m.module_id ? null : m.module_id
                      )
                    }
                    className="border-b hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="p-3">{m.title}</td>
                    <td className="p-3">{m.attempts}</td>
                    <td className="p-3">{m.completions}</td>
                  </tr>

                  {selectedModuleId === m.module_id && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={3} className="p-4">
                        <ModuleDetailPanel module={m} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </section>
      )}

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
              {institutions.map((inst) => (
                <React.Fragment key={inst.institution}>
                  <tr
                    onClick={() =>
                      setSelectedInstitution(
                        selectedInstitution === inst.institution
                          ? null
                          : inst.institution
                      )
                    }
                    className="border-b hover:bg-gray-100 cursor-pointer"
                  >
                    <td className="p-3">{inst.institution}</td>
                    <td className="p-3">{inst.userCount}</td>
                    <td className="p-3">{inst.totalCompletions}</td>
                  </tr>

                  {selectedInstitution === inst.institution && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan={3} className="p-4">
                        <InstitutionDetailPanel
                          institution={inst}
                          allModules={allModules}
                        />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
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

function UserDetailPanel({
  user,
  allModules,
}: {
  user: UserSummary;
  allModules: ModuleMeta[];
}) {
  const completed = user.modules.filter((m) => m.status === "completed");
  const inProgress = user.modules.filter((m) => m.status === "in_progress");

  const notStarted = allModules.filter(
    (mod) => !user.modules.some((m) => m.module_id === mod.id)
  );

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

      <div>
        <h3 className="font-semibold text-gray-800">Modules Not Started</h3>
        {notStarted.length === 0 ? (
          <p className="text-xs text-gray-500">None.</p>
        ) : (
          <ul className="text-xs">
            {notStarted.map((m) => (
              <li key={m.id}>{m.title}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ModuleDetailPanel({ module }: { module: ModuleSummary }) {
  return (
    <div className="text-sm text-gray-700 space-y-2">
      <h3 className="text-lg font-semibold text-semcmeBlue">{module.title}</h3>

      <p>
        <strong>Attempts:</strong> {module.attempts}
      </p>

      <p>
        <strong>Completions:</strong> {module.completions}
      </p>

      <p>
        <strong>Average Progress:</strong> {module.avgProgress}%
      </p>

      <h4 className="font-semibold mt-2">Users Completed</h4>
      <p>{module.usersCompleted}</p>

      <h4 className="font-semibold mt-2">Users In Progress</h4>
      <p>{module.usersInProgress}</p>

      <h4 className="font-semibold mt-2">Users Not Started</h4>
      <p>{module.usersNotStarted}</p>
    </div>
  );
}

function InstitutionDetailPanel({
  institution,
  allModules,
}: {
  institution: InstitutionSummary;
  allModules: ModuleMeta[];
}) {
  const moduleTitleMap = new Map(allModules.map((m) => [m.id, m.title]));
  const entries = Object.entries(institution.perModule);

  return (
    <div className="text-sm text-gray-700 space-y-2">
      <h3 className="text-lg font-semibold text-semcmeBlue">
        {institution.institution} — Module Breakdown
      </h3>

      {entries.length === 0 ? (
        <p className="text-xs text-gray-500">
          No module completions for this institution yet.
        </p>
      ) : (
        <ul className="text-xs">
          {entries.map(([moduleId, count]) => (
            <li key={moduleId}>
              <strong>{moduleTitleMap.get(moduleId) ?? moduleId}</strong> —{" "}
              {count} completion{count === 1 ? "" : "s"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
