//app/admin-dashboard/page.tsx
"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import React from "react";
import PostAssessmentsTab from "./PostAssessmentsTab";
import { Link } from "lucide-react";

/* ---------------- CSV EXPORT HELPER ---------------- */

function exportCSV(filename: string, rows: Record<string, any>[]) {
  if (!rows || rows.length === 0) {
    alert("No data to export.");
    return;
  }

  const escape = (val: any) => {
    if (val == null) return "";
    const str = String(val);
    if (str.includes('"') || str.includes(",") || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = Object.keys(rows[0]).join(",");
  const data = rows
    .map((row) => Object.values(row).map(escape).join(","))
    .join("\n");

  const csvContent = "\uFEFF" + headers + "\n" + data;
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/* ---------------- UPDATED TYPES ---------------- */

type UserModuleRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  institution: string | null;
  role: string | null;
  user_created_at: string | null;

  module_id: string | null;
  module_title: string | null;
  order_index: number | null;
  skill_level: string | null;

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
  skill_level: string | null;
};

type PostAssessment = {
  id: string;
  module_id: string;
  responses: Record<string, string>;
  submitted_at: string;
};

type AnalyticsResponse = {
  userModules: UserModuleRow[];
  modules: ModuleMeta[];
  postAssessments: PostAssessment[];
};

type UserSummary = {
  user_id: string;
  name: string;
  email: string;
  institution: string;
  role: string;
  createdAt: string | null;
  completedCount: number;
  inProgressCount: number;
  modules: UserModuleRow[];
};

type ModuleSummary = {
  module_id: string;
  title: string;
  skill_level: string | null;
  attempts: number;
  completions: number;
  avgProgress: number;
  order_index: number | null;
  usersCompleted: number;
  usersInProgress: number;
  usersNotStarted: number;
  certificateCount: number;
};

type InstitutionSummary = {
  institution: string;
  userCount: number;
  totalCompletions: number;
  totalCertificates: number;
  perModule: Record<string, number>;
};

/* ---------------- COMPONENT START ---------------- */

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [tab, setTab] = useState<
    | "users"
    | "modules"
    | "institutions"
    | "assessments"
    | "dataRequests"
    | "adminApprovals"
  >("users");

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [selectedInstitution, setSelectedInstitution] = useState<string | null>(
    null,
  );

  const [filterModuleId, setFilterModuleId] = useState<string | "all">("all");
  const [filterInstitution, setFilterInstitution] = useState<string | "all">(
    "all",
  );
  const [filterRole, setFilterRole] = useState<string | "all">("all");
  const [filterSkillLevel, setFilterSkillLevel] = useState<string | "all">(
    "all",
  );
  const [filterSelectedModules, setFilterSelectedModules] = useState<string[]>(
    [],
  );
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);
  const moduleDropdownRef = useRef<HTMLDivElement | null>(null);

  /* ------------------- LOAD ANALYTICS ------------------- */

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch("/api/admin/analytics");
        if (!res.ok) {
          setAnalytics({
            userModules: [],
            modules: [],
            postAssessments: [],
          });
          return;
        }
        const data = (await res.json()) as AnalyticsResponse;
        setAnalytics(data);
      } catch {
        setAnalytics({
          userModules: [],
          modules: [],
          postAssessments: [],
        });
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        moduleDropdownRef.current &&
        !moduleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModuleDropdownOpen(false);
      }
    }

    if (isModuleDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModuleDropdownOpen]);

  /* ------------------- PROCESS ANALYTICS ------------------- */

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

    // Initialize modules
    for (const mod of allModules) {
      moduleMap.set(mod.id, {
        module_id: mod.id,
        title: mod.title,
        skill_level: mod.skill_level ?? null,
        attempts: 0,
        completions: 0,
        avgProgress: 0,
        order_index: mod.order_index ?? 0,
        usersCompleted: 0,
        usersInProgress: 0,
        usersNotStarted: 0,
        certificateCount: 0,
      });
    }

    // Process rows
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
          role: row.role ?? "",
          createdAt: row.user_created_at ?? null,
          completedCount: 0,
          inProgressCount: 0,
          modules: [],
        });
      }

      const u = usersMap.get(id)!;

      if (row.module_id) {
        const m = moduleMap.get(row.module_id);
        if (!m) continue;

        u.modules.push(row);

        if (row.status === "completed") u.completedCount++;
        if (row.status === "in_progress") u.inProgressCount++;

        if (row.status === "completed") m.usersCompleted++;
        else if (row.status === "in_progress") m.usersInProgress++;

        if (row.status) m.attempts++;
        if (row.status === "completed") m.completions++;

        if (row.cert_url) {
          m.certificateCount++;
        }

        if (typeof row.progress_percent === "number") {
          (m as any)._sum = ((m as any)._sum ?? 0) + row.progress_percent;
          (m as any)._count = ((m as any)._count ?? 0) + 1;
        }
      }
    }

    // Finalize module stats
    for (const [, mod] of moduleMap) {
      const totalUsers = usersMap.size;
      const started = mod.usersCompleted + mod.usersInProgress;
      mod.usersNotStarted = totalUsers - started;

      const sum = (mod as any)._sum ?? 0;
      const count = (mod as any)._count ?? 0;
      mod.avgProgress = count ? Math.round(sum / count) : 0;
    }

    // Build institution summary
    for (const [, u] of usersMap) {
      const inst = u.institution.trim() || "Unknown";

      if (!institutionMap.has(inst)) {
        institutionMap.set(inst, {
          institution: inst,
          userCount: 0,
          totalCompletions: 0,
          totalCertificates: 0,
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

        if (m.cert_url) {
          i.totalCertificates++;
        }
      }
    }

    const kpiUsers = usersMap.size;
    const kpiCompletions = Array.from(usersMap.values()).reduce(
      (sum, u) => sum + u.completedCount,
      0,
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
        (a, b) => (a.order_index ?? 0) - (b.order_index ?? 0),
      ),
      institutions: Array.from(institutionMap.values()),
      kpis: {
        totalUsers: kpiUsers,
        totalCompletions: kpiCompletions,
        avgProgress,
      },
      moduleOptions: allModules.map((m) => ({
        value: m.id,
        label: m.title,
      })),
      institutionOptions: Array.from(institutionMap.values()).map((i) => ({
        value: i.institution,
        label: i.institution,
      })),
      allModules,
    };
  }, [analytics]);

  /* -------------------- FILTER USERS -------------------- */

  const filteredUsers = useMemo(() => {
    let list = [...users];

    if (filterInstitution !== "all") {
      list = list.filter((u) => u.institution === filterInstitution);
    }

    if (filterRole !== "all") {
      list = list.filter((u) => u.role === filterRole);
    }

    if (filterModuleId !== "all") {
      list = list.filter((u) =>
        u.modules.some((m) => m.module_id === filterModuleId),
      );
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    return list;
  }, [users, search, filterInstitution, filterModuleId, filterRole]);

  const filteredModules = useMemo(() => {
    let list = [...modules];

    // Skill Level filter
    if (filterSkillLevel !== "all") {
      list = list.filter((m) => m.skill_level === filterSkillLevel);
    }

    // Multi-module selector filter
    if (filterSelectedModules.length > 0) {
      list = list.filter((m) => filterSelectedModules.includes(m.module_id));
    }

    // Institution filter
    if (filterInstitution !== "all") {
      list = list.map((m) => {
        const instUsers = users.filter(
          (u) => u.institution === filterInstitution,
        );

        const completed = instUsers.filter((u) =>
          u.modules.some(
            (mod) =>
              mod.module_id === m.module_id && mod.status === "completed",
          ),
        ).length;

        const inProgress = instUsers.filter((u) =>
          u.modules.some(
            (mod) =>
              mod.module_id === m.module_id && mod.status === "in_progress",
          ),
        ).length;

        const started = completed + inProgress;

        const certificates = instUsers.filter((u) =>
          u.modules.some(
            (mod) => mod.module_id === m.module_id && mod.cert_url,
          ),
        ).length;

        return {
          ...m,
          usersCompleted: completed,
          usersInProgress: inProgress,
          usersNotStarted: instUsers.length - started,
          attempts: started,
          certificateCount: certificates,
        };
      });
    }

    return list;
  }, [
    modules,
    filterSkillLevel,
    filterInstitution,
    filterSelectedModules,
    users,
  ]);

  /* ------------------- LOADING ------------------- */

  if (loading)
    return (
      <div className="text-center py-10">
        <h1 className="text-3xl font-bold text-semcmeBlue">Admin Dashboard</h1>
        <p className="text-gray-500">Loading…</p>
      </div>
    );

  /* ------------------- EXPORT BUTTONS ------------------- */

  const exportUsers = () => {
    const rows = filteredUsers.map((u) => {
      const completed = u.modules.filter((m) => m.status === "completed");
      const inProgress = u.modules.filter((m) => m.status === "in_progress");

      const notStarted = allModules.filter(
        (mod) => !u.modules.some((m) => m.module_id === mod.id),
      );

      return {
        name: u.name,
        email: u.email,
        institution: u.institution,
        role: u.role,
        account_created: u.createdAt,
        completed_count: u.completedCount,
        in_progress_count: u.inProgressCount,

        completed_modules: completed
          .map(
            (m) =>
              `${m.module_title ?? m.module_id} (${m.date_completed ?? "—"} | ${
                m.cert_url ? "Certificate Issued" : "No Certificate"
              })`,
          )
          .join("; "),

        in_progress_modules: inProgress
          .map(
            (m) =>
              `${m.module_title ?? m.module_id} (${m.progress_percent ?? 0}%)`,
          )
          .join("; "),

        not_started_modules: notStarted.map((m) => m.title).join("; "),
      };
    });

    exportCSV("users.csv", rows);
  };

  const exportModules = () => {
    const rows = filteredModules.map((m) => {
      const completedUsers = users.filter((u) =>
        u.modules.some(
          (mod) => mod.module_id === m.module_id && mod.status === "completed",
        ),
      );

      const inProgressUsers = users.filter((u) =>
        u.modules.some(
          (mod) =>
            mod.module_id === m.module_id && mod.status === "in_progress",
        ),
      );

      const notStartedUsers = users.filter(
        (u) => !u.modules.some((mod) => mod.module_id === m.module_id),
      );

      return {
        module_title: m.title,
        skill_level: m.skill_level,
        total_users_started: m.attempts,
        total_in_progress: m.usersInProgress,
        total_completed: m.usersCompleted,
        avg_progress_percent: m.avgProgress,
        total_certificates_issued: m.certificateCount,

        completed_users: completedUsers
          .map((u) => `${u.name} | ${u.email}`)
          .join("; "),

        in_progress_users: inProgressUsers
          .map((u) => `${u.name} | ${u.email}`)
          .join("; "),

        not_started_users: notStartedUsers
          .map((u) => `${u.name} | ${u.email}`)
          .join("; "),
      };
    });

    exportCSV("modules.csv", rows);
  };

  const exportInstitutions = () => {
    const rows = institutions.map((inst) => {
      const instUsers = users.filter(
        (u) => (u.institution.trim() || "Unknown") === inst.institution,
      );

      return {
        institution_name: inst.institution,
        total_users: inst.userCount,
        total_modules_completed: inst.totalCompletions,
        total_certificates_issued: inst.totalCertificates,

        user_list: instUsers
          .map((u) => `${u.name} | ${u.email} | ${u.role}`)
          .join("; "),
      };
    });

    exportCSV("institutions.csv", rows);
  };

  /* ------------------- RENDER ------------------- */

  return (
    <div className="space-y-8">
      <h1 className="text-4xl font-bold text-semcmeBlue text-center">
        Admin Dashboard
      </h1>

      {/* KPI CARDS */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <KpiCard label="Total Users" value={kpis.totalUsers} />
        <KpiCard
          label="Total Module Completions"
          value={kpis.totalCompletions}
        />
        <KpiCard label="Avg Progress %" value={`${kpis.avgProgress}%`} />
      </section>

      {/* TABS */}
      <div className="flex gap-2 justify-center">
        {[
          "users",
          "modules",
          "institutions",
          "assessments",
          "dataRequests",
          "adminApprovals",
        ].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as any)}
            className={`px-4 py-2 rounded-full text-sm font-semibold border ${
              tab === t
                ? "bg-semcmeBlue text-white border-semcmeBlue"
                : "bg-white text-semcmeBlue border-semcmeBlue/40"
            }`}
          >
            {t === "dataRequests"
              ? "Data Requests"
              : t === "adminApprovals"
                ? "Admin Approvals"
                : t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {/* USERS TAB */}
      {tab === "users" && (
        <>
          {/* FILTER BAR */}
          <section className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3 w-full max-w-5xl mx-auto">
            <input
              placeholder="Search by User/Email/Institution…"
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              value={filterModuleId}
              onChange={(e) =>
                setFilterModuleId(
                  e.target.value === "all" ? "all" : e.target.value,
                )
              }
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
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
                  e.target.value === "all" ? "all" : e.target.value,
                )
              }
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
            >
              <option value="all">All institutions</option>
              {institutionOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>

            <select
              value={filterRole}
              onChange={(e) =>
                setFilterRole(e.target.value === "all" ? "all" : e.target.value)
              }
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
            >
              <option value="all">All roles</option>
              {Array.from(new Set(users.map((u) => u.role))).map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </section>

          {/* EXPORT BUTTON */}
          <div className="flex justify-end mb-2 pr-1">
            <button
              onClick={exportUsers}
              className="px-4 py-2 bg-semcmeBlue text-white rounded-md hover:bg-semcmeBlue/90"
            >
              Export Users CSV
            </button>
          </div>

          <p className="text-center text-sm text-gray-500 mb-1">
            Click a user row to expand their full module history.
          </p>

          {/* TABLE WRAPPER */}
          <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-semcmeBlue text-white">
                <tr>
                  <th className="p-3 text-left">Name</th>
                  <th className="p-3 text-left">Email</th>
                  <th className="p-3 text-left">Institution</th>
                  <th className="p-3 text-left">Role</th>
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
                          selectedUserId === u.user_id ? null : u.user_id,
                        )
                      }
                      className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="p-3">{u.name}</td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.institution}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3">{u.completedCount}</td>
                      <td className="p-3">{u.inProgressCount}</td>
                    </tr>

                    {selectedUserId === u.user_id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={6} className="p-4">
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

      {/* MODULES TAB */}
      {tab === "modules" && (
        <>
          <section className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3 w-full max-w-5xl mx-auto">
            <select
              value={filterSkillLevel}
              onChange={(e) =>
                setFilterSkillLevel(
                  e.target.value === "all" ? "all" : e.target.value,
                )
              }
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
            >
              <option value="all">All Skill Levels</option>
              {Array.from(
                new Set(modules.map((m) => m.skill_level).filter(Boolean)),
              ).map((level) => (
                <option key={level as string} value={level as string}>
                  {level}
                </option>
              ))}
            </select>

            <select
              value={filterInstitution}
              onChange={(e) =>
                setFilterInstitution(
                  e.target.value === "all" ? "all" : e.target.value,
                )
              }
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
            >
              <option value="all">All Institutions</option>
              {institutionOptions.map((i) => (
                <option key={i.value} value={i.value}>
                  {i.label}
                </option>
              ))}
            </select>

            <div ref={moduleDropdownRef} className="relative flex-1">
              <button
                type="button"
                onClick={() => setIsModuleDropdownOpen((prev) => !prev)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 bg-white text-left"
              >
                {filterSelectedModules.length === 0
                  ? "Select Modules"
                  : `${filterSelectedModules.length} Module(s) Selected`}
              </button>

              {isModuleDropdownOpen && (
                <div className="absolute z-30 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto p-3 space-y-2">
                  {modules.map((m) => (
                    <label
                      key={m.module_id}
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={filterSelectedModules.includes(m.module_id)}
                        onChange={() => {
                          setFilterSelectedModules((prev) =>
                            prev.includes(m.module_id)
                              ? prev.filter((id) => id !== m.module_id)
                              : [...prev, m.module_id],
                          );
                        }}
                      />
                      {m.title}
                    </label>
                  ))}
                </div>
              )}
            </div>
          </section>

          <div className="flex justify-end mb-2">
            <button
              onClick={exportModules}
              className="px-4 py-2 bg-semcmeBlue text-white rounded-md hover:bg-semcmeBlue/90"
            >
              Export Modules CSV
            </button>
          </div>

          <section className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-semcmeBlue text-white">
                <tr>
                  <th className="p-3 text-left">Module</th>
                  <th className="p-3 text-left">Skill Level</th>
                  <th className="p-3 text-left">Started</th>
                  <th className="p-3 text-left">In Progress</th>
                  <th className="p-3 text-left">Completed</th>
                </tr>
              </thead>

              <tbody>
                {filteredModules.map((m) => (
                  <React.Fragment key={m.module_id}>
                    <tr
                      onClick={() =>
                        setSelectedModuleId(
                          selectedModuleId === m.module_id ? null : m.module_id,
                        )
                      }
                      className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="p-3">{m.title}</td>
                      <td className="p-3">{m.skill_level ?? "—"}</td>
                      <td className="p-3">{m.attempts}</td>
                      <td className="p-3">{m.usersInProgress}</td>
                      <td className="p-3">{m.usersCompleted}</td>
                    </tr>

                    {selectedModuleId === m.module_id && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={5} className="p-4">
                          <ModuleDetailPanel
                            module={m}
                            users={users}
                            filterInstitution={filterInstitution}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {/* INSTITUTIONS TAB */}
      {tab === "institutions" && (
        <>
          <div className="flex justify-end mb-2">
            <button
              onClick={exportInstitutions}
              className="px-4 py-2 bg-semcmeBlue text-white rounded-md hover:bg-semcmeBlue/90"
            >
              Export Institutions CSV
            </button>
          </div>

          <section className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white">
            <table className="min-w-full text-sm">
              <thead className="bg-semcmeBlue text-white">
                <tr>
                  <th className="p-3 text-left">Institution</th>
                  <th className="p-3 text-left">Users</th>
                  <th className="p-3 text-left">Total Completions</th>
                  <th className="p-3 text-left">Total Certificates Issued</th>
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
                            : inst.institution,
                        )
                      }
                      className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    >
                      <td className="p-3">{inst.institution}</td>
                      <td className="p-3">{inst.userCount}</td>
                      <td className="p-3">{inst.totalCompletions}</td>
                      <td className="p-3">{inst.totalCertificates}</td>
                    </tr>

                    {selectedInstitution === inst.institution && (
                      <tr className="bg-gray-50 border-b border-gray-200">
                        <td colSpan={4} className="p-4">
                          <InstitutionDetailPanel
                            institution={inst}
                            allModules={allModules}
                            users={users}
                          />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </section>
        </>
      )}

      {tab === "assessments" && (
        <PostAssessmentsTab
          assessments={analytics?.postAssessments ?? []}
          modules={analytics?.modules ?? []}
        />
      )}

      {tab === "dataRequests" && <DataRequestsTab />}
      {tab === "adminApprovals" && <AdminApprovalsTab />}
    </div>
  );
}

/* ---------------- SUB-COMPONENTS ---------------- */

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-300 p-4 text-center">
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
    (mod) => !user.modules.some((m) => m.module_id === mod.id),
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
                <strong>{m.module_title ?? m.module_id}</strong>

                <div>
                  • Completed:{" "}
                  {m.date_completed
                    ? new Date(m.date_completed).toLocaleDateString()
                    : "date unknown"}
                </div>

                <div>• Certificate Issued: {m.cert_url ? "Yes" : "No"}</div>

                {m.cert_issued_at && (
                  <div>
                    • Certificate Issue Date:{" "}
                    {new Date(m.cert_issued_at).toLocaleDateString()}
                  </div>
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

function ModuleDetailPanel({
  module,
  users,
  filterInstitution,
}: {
  module: ModuleSummary;
  users: UserSummary[];
  filterInstitution: string | "all";
}) {
  const scopedUsers =
    filterInstitution === "all"
      ? users
      : users.filter((u) => u.institution === filterInstitution);

  const completedUsers = scopedUsers.filter((u) =>
    u.modules.some(
      (m) => m.module_id === module.module_id && m.status === "completed",
    ),
  );

  const inProgressUsers = scopedUsers.filter((u) =>
    u.modules.some(
      (m) => m.module_id === module.module_id && m.status === "in_progress",
    ),
  );

  const notStartedUsers = scopedUsers.filter(
    (u) => !u.modules.some((m) => m.module_id === module.module_id),
  );

  return (
    <div className="text-sm text-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-semcmeBlue">{module.title}</h3>

      <div>
        <p>
          <strong>Skill Level:</strong> {module.skill_level ?? "—"}
        </p>
        <p>
          <strong>Average Progress:</strong> {module.avgProgress}%
        </p>
        <p>
          <strong>Total Certificates Issued:</strong> {module.certificateCount}
        </p>
      </div>

      <div>
        <h4 className="font-semibold text-gray-800">Users Completed</h4>
        {completedUsers.length === 0 ? (
          <p className="text-xs text-gray-500">None.</p>
        ) : (
          <ul className="text-xs">
            {completedUsers.map((u) => (
              <li key={u.user_id}>
                {u.name} ({u.email})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-gray-800">Users In Progress</h4>
        {inProgressUsers.length === 0 ? (
          <p className="text-xs text-gray-500">None.</p>
        ) : (
          <ul className="text-xs">
            {inProgressUsers.map((u) => (
              <li key={u.user_id}>
                {u.name} ({u.email})
              </li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="font-semibold text-gray-800">Users Not Started</h4>
        {notStartedUsers.length === 0 ? (
          <p className="text-xs text-gray-500">None.</p>
        ) : (
          <ul className="text-xs">
            {notStartedUsers.map((u) => (
              <li key={u.user_id}>
                {u.name} ({u.email})
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function InstitutionDetailPanel({
  institution,
  allModules,
  users,
}: {
  institution: InstitutionSummary;
  allModules: ModuleMeta[];
  users: UserSummary[];
}) {
  const instUsers = users.filter(
    (u) => (u.institution.trim() || "Unknown") === institution.institution,
  );

  return (
    <div className="text-sm text-gray-700 space-y-4">
      <h3 className="text-lg font-semibold text-semcmeBlue">
        {institution.institution}
      </h3>

      {instUsers.length === 0 ? (
        <p className="text-xs text-gray-500">
          No users found for this institution.
        </p>
      ) : (
        <div className="space-y-4">
          {instUsers.map((u) => {
            const completed = u.modules.filter((m) => m.status === "completed");

            return (
              <div key={u.user_id} className="border rounded-md p-3 bg-white">
                <p>
                  <strong>{u.name}</strong> ({u.email}) — {u.role}
                </p>

                {completed.length === 0 ? (
                  <p className="text-xs text-gray-500 mt-1">
                    No completed modules.
                  </p>
                ) : (
                  <ul className="text-xs mt-1">
                    {completed.map((m, idx) => (
                      <li key={idx}>
                        {m.module_title ?? m.module_id} —{" "}
                        {m.cert_url ? "Certificate Issued" : "No Certificate"}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DataRequestsTab() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);
    const res = await fetch("/api/admin/data-requests");
    const data = await res.json();
    setRequests(data || []);
    setLoading(false);
  }

  async function markCompleted(id: string) {
    await fetch("/api/admin/update-request-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });

    loadRequests();
  }

  if (loading) return <p className="text-center py-6">Loading requests...</p>;

  if (requests.length === 0)
    return (
      <p className="text-center py-6 text-gray-500">No data requests found.</p>
    );

  const pendingRequests = requests.filter((r) => r.status === "pending");

  const completedRequests = requests.filter((r) => r.status === "completed");

  return (
    <div className="space-y-10 mt-6">
      {/* ================== PENDING SECTION ================== */}
      <div>
        <h2 className="text-xl font-semibold text-semcmeBlue mb-4">
          Pending Requests
        </h2>

        {pendingRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">No pending requests.</p>
        ) : (
          <div className="space-y-6">
            {pendingRequests.map((r) => (
              <RequestCard
                key={r.id}
                request={r}
                showCompleteButton
                onComplete={markCompleted}
              />
            ))}
          </div>
        )}
      </div>

      {/* ================== COMPLETED SECTION ================== */}
      <div>
        <h2 className="text-xl font-semibold text-semcmeBlue mb-4">
          Completed Requests
        </h2>

        {completedRequests.length === 0 ? (
          <p className="text-gray-500 text-sm">No completed requests yet.</p>
        ) : (
          <div className="space-y-6">
            {completedRequests.map((r) => (
              <RequestCard key={r.id} request={r} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({
  request,
  showCompleteButton = false,
  onComplete,
}: {
  request: any;
  showCompleteButton?: boolean;
  onComplete?: (id: string) => void;
}) {
  return (
    <div className="border border-gray-300 shadow-sm bg-white p-6 rounded-md">
      <div className="flex justify-between items-start mb-4">
        <div className="space-y-2">
          <p className="font-semibold text-semcmeBlue text-lg">
            Report Type: {request.report_type.toUpperCase()}
          </p>

          <p className="text-sm text-gray-600">
            Date Requested: {new Date(request.created_at).toLocaleDateString()}
          </p>

          <p className="text-sm">
            <strong>Institution:</strong> {request.institution_name}
          </p>

          <p className="text-sm">
            <strong>Requestor Email:</strong> {request.requestor_email}
          </p>
        </div>

        <div className="capitalize font-medium text-sm px-3 py-1 rounded bg-gray-100">
          {request.status}
        </div>
      </div>

      <div className="space-y-2 text-sm">
        {request.individual_user_email && (
          <p>
            <strong>Individual User Email:</strong>{" "}
            {request.individual_user_email}
          </p>
        )}

        <p>
          <strong>Module Scope:</strong> {request.module_scope}
        </p>

        {request.selected_modules?.length > 0 && (
          <p>
            <strong>Selected Modules:</strong>{" "}
            {request.selected_modules.join(", ")}
          </p>
        )}

        {request.additional_notes && (
          <p>
            <strong>Additional Notes:</strong> {request.additional_notes}
          </p>
        )}
      </div>

      {showCompleteButton && (
        <div className="pt-4">
          <button
            onClick={() => onComplete?.(request.id)}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            Mark Completed
          </button>
        </div>
      )}
    </div>
  );
}

function AdminApprovalsTab() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAdmins();
  }, []);

  async function loadAdmins() {
    setLoading(true);
    const res = await fetch("/api/admin/institution-admins");
    const data = await res.json();
    setAdmins(data || []);
    setLoading(false);
  }

  async function approve(id: string) {
    await fetch("/api/admin/approve-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAdmins();
  }

  async function deny(id: string) {
    await fetch("/api/admin/deny-admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    loadAdmins();
  }

  if (loading)
    return <p className="text-center py-6">Loading administrators...</p>;

  const pending = admins.filter((a) => !a.is_approved && !a.is_denied);
  const approved = admins.filter((a) => a.is_approved && !a.is_denied);
  const denied = admins.filter((a) => a.is_denied);

  return (
    <div className="space-y-10 mt-6">
      <AdminSection
        title="Pending Institution Administrators"
        admins={pending}
        status="pending"
        approve={approve}
        deny={deny}
      />

      <AdminSection
        title="Approved Institution Administrators"
        admins={approved}
        status="approved"
      />

      <AdminSection
        title="Denied Institution Administrators"
        admins={denied}
        status="denied"
      />
    </div>
  );
}

function AdminSection({
  title,
  admins,
  status,
  approve,
  deny,
}: {
  title: string;
  admins: any[];
  status: "pending" | "approved" | "denied";
  approve?: (id: string) => void;
  deny?: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-semcmeBlue mb-4">{title}</h2>

      {admins.length === 0 ? (
        <p className="text-gray-500 text-sm">No records found.</p>
      ) : (
        <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2">
          {admins.map((a) => (
            <div
              key={a.id}
              className="border border-gray-300 shadow-sm bg-white p-6 rounded-md"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="space-y-2">
                  <p className="font-semibold text-semcmeBlue text-lg">
                    {a.first_name} {a.last_name}
                  </p>

                  <p className="text-sm text-gray-600">
                    <strong>Email:</strong> {a.email}
                  </p>

                  <p className="text-sm">
                    <strong>Institution:</strong> {a.institution_name}
                  </p>
                </div>

                <div
                  className={`capitalize font-medium text-sm px-3 py-1 rounded ${
                    status === "pending"
                      ? "bg-yellow-100 text-yellow-800"
                      : status === "approved"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                  }`}
                >
                  {status}
                </div>
              </div>

              {status === "pending" && (
                <div className="flex gap-3 pt-3">
                  <button
                    onClick={() => approve?.(a.id)}
                    className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition"
                  >
                    Approve
                  </button>

                  <button
                    onClick={() => deny?.(a.id)}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                  >
                    Deny
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
