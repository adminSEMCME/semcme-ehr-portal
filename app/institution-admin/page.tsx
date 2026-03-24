"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";

type Tab = "users" | "modules";

export default function InstitutionAdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  const [institution, setInstitution] = useState<string | null>(null);
  const [overseeRole, setOverseeRole] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [filterModuleId, setFilterModuleId] = useState<string>("all");

  const [selectedGroups, setSelectedGroups] = useState<string[]>([]);

  const [filterSelectedModules, setFilterSelectedModules] = useState<string[]>(
    [],
  );
  const [isModuleDropdownOpen, setIsModuleDropdownOpen] = useState(false);

  const moduleDropdownRef = useRef<HTMLDivElement | null>(null);

  /* ---------------- LOAD PROFILE ---------------- */
  useEffect(() => {
    async function loadProfile() {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const user = session?.user;
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select(`oversee_role, institutions ( name )`)
        .eq("id", user.id)
        .single();

      if (profile) {
        setInstitution((profile.institutions as any)?.name || null);
        setOverseeRole(profile.oversee_role || null);
      }
    }

    loadProfile();
  }, []);

  /* ---------------- LOAD ANALYTICS ---------------- */
  useEffect(() => {
    async function loadAnalytics() {
      try {
        const res = await fetch("/api/institution-admin/analytics");
        const data = await res.json();
        setAnalytics(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    loadAnalytics();
  }, []);

  /* ---------------- PRELOAD FILTER (IMPORTANT) ---------------- */
  const filteredRows = (analytics?.userModules ?? []).filter((row: any) => {
    return (
      row.institution === institution &&
      row.role?.toLowerCase() === overseeRole?.toLowerCase()
    );
  });

  /* ---------------- BUILD USERS ---------------- */
  const users = useMemo(() => {
    const map = new Map();

    for (const row of filteredRows) {
      if (!map.has(row.user_id)) {
        map.set(row.user_id, {
          user_id: row.user_id,
          name:
            `${row.first_name ?? ""} ${row.last_name ?? ""}`.trim() ||
            "Unnamed",
          email: row.email,
          institution: row.institution,
          role: row.role,
          modules: [],
          created_at: row.user_created_at || null,
          completedCount: 0,
          inProgressCount: 0,
        });
      }

      const u = map.get(row.user_id);

      if (row.status === "completed") u.completedCount++;
      if (row.status === "in_progress") u.inProgressCount++;

      u.modules.push(row);
    }

    return Array.from(map.values());
  }, [filteredRows]);

  /* ---------------- FILTER USERS (UI FILTER) ---------------- */
  const filteredUsers = users.filter((u: any) => {
    if (search) {
      const q = search.toLowerCase();
      if (
        !u.name.toLowerCase().includes(q) &&
        !u.email.toLowerCase().includes(q)
      ) {
        return false;
      }
    }

    if (filterModuleId !== "all") {
      return u.modules.some((m: any) => m.module_id === filterModuleId);
    }

    return true;
  });

  /* ---------------- BUILD MODULES ---------------- */
  const modules = useMemo(() => {
    const allModules = analytics?.modules ?? [];

    let base = allModules.map((mod: any) => {
      const rows = filteredRows.filter((r: any) => r.module_id === mod.id);

      return {
        id: mod.id,
        title: mod.title,
        skill_level: mod.skill_level,

        started: rows.length,
        inProgress: rows.filter((r: any) => r.status === "in_progress").length,
        completed: rows.filter((r: any) => r.status === "completed").length,

        rows,
      };
    });

    // ✅ APPLY MULTI-SELECT FILTER
    if (filterSelectedModules.length > 0) {
      base = base.filter((m: any) => filterSelectedModules.includes(m.id));
    }

    return base;
  }, [analytics, filteredRows, filterSelectedModules]);

  /* ---------------- ALL MODULES (FOR DETAIL PANEL) ---------------- */
  const allModules = analytics?.modules ?? [];

  /* ---------------- EXPORT ---------------- */
  function exportCSV(filename: string, rows: any[]) {
    if (!rows.length) return;

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        headers
          .map((h) => {
            const val = row[h];

            if (typeof val === "string") {
              return `"${val.replace(/"/g, '""')}"`;
            }

            return val ?? "";
          })
          .join(","),
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  }

  function exportUsers() {
    const rows = filteredUsers.map((u: any) => {
      const completed = u.modules.filter((m: any) => m.status === "completed");
      const inProgress = u.modules.filter(
        (m: any) => m.status === "in_progress",
      );

      const notStarted = allModules.filter(
        (mod: any) => !u.modules.some((m: any) => m.module_id === mod.id),
      );

      return {
        account_created: u.created_at
          ? new Date(u.created_at).toLocaleDateString()
          : "—",
        name: u.name,
        email: u.email,
        institution: u.institution,
        role: u.role,

        completed_count: completed.length,
        in_progress_count: inProgress.length,
        not_started_count: notStarted.length,

        completed_modules: completed
          .map((m: any) => m.module_title ?? m.module_id)
          .join(" || "),

        in_progress_modules: inProgress
          .map(
            (m: any) =>
              `${m.module_title ?? m.module_id} (${m.progress_percent ?? 0}%)`,
          )
          .join(" || "),

        not_started_modules: notStarted.map((m: any) => m.title).join(" || "),
      };
    });

    exportCSV("users.csv", rows);
  }

  function exportModules() {
    const rows = modules.map((m: any) => {
      const completedUsers = users.filter((u: any) =>
        u.modules.some(
          (mod: any) => mod.module_id === m.id && mod.status === "completed",
        ),
      );

      const inProgressUsers = users.filter((u: any) =>
        u.modules.some(
          (mod: any) => mod.module_id === m.id && mod.status === "in_progress",
        ),
      );

      const notStartedUsers = users.filter(
        (u: any) => !u.modules.some((mod: any) => mod.module_id === m.id),
      );

      return {
        module_title: m.title,
        total_started: m.started,
        total_in_progress: m.inProgress,
        total_completed: m.completed,

        completed_users: completedUsers
          .map((u: any) => `${u.name}: ${u.email}`)
          .join(" || "),

        in_progress_users: inProgressUsers
          .map((u: any) => `${u.name}: ${u.email}`)
          .join(" || "),

        not_started_users: notStartedUsers
          .map((u: any) => `${u.name}: ${u.email}`)
          .join(" || "),
      };
    });

    exportCSV("modules.csv", rows);
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        moduleDropdownRef.current &&
        !moduleDropdownRef.current.contains(event.target as Node)
      ) {
        setIsModuleDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  type ModuleGroupKey = "UME" | "GME" | "CME";

  const MODULE_GROUPS: Record<ModuleGroupKey, string[]> = {
    UME: [
      "intro",
      "M1",
      "M3",
      "umecoding",
      "OrdersAndOrderSets",
      "SocialDeterminants",
    ],
    GME: [
      "intro",
      "GME",
      "mock-ehr",
      "HighYieldNotes",
      "coding1",
      "MedicalProcedureAndVisitCoding",
      "ICD10",
      "SocialDeterminants",
    ],
    CME: [
      "intro",
      "CME1",
      "TOCHospitals",
      "TOCPrimaryCare",
      "SocialDeterminants",
      "CME2",
      "DM",
    ],
  };

  return (
    <div className="space-y-8">
      {(loading || !analytics || !institution || !overseeRole) && (
        <div className="text-center py-10 text-gray-600">Loading...</div>
      )}
      {/* TITLE */}
      <h1 className="text-4xl font-bold text-semcmeBlue text-center">
        Institution Administrator Dashboard
      </h1>

      {/* INFO SECTION */}
      <div className="max-w-5xl mx-auto bg-blue-50 border border-blue-200 rounded-xl p-5 text-sm text-gray-700 space-y-3">
        <h2 className="text-lg font-semibold text-semcmeBlue">
          How to Use This Dashboard
        </h2>

        <p>
          This dashboard allows you to monitor user progress within your
          institution for your assigned role.
        </p>

        <div className="space-y-2">
          <p>
            <strong>Users Tab:</strong> View all users in your institution and
            role. Click a user row to expand their full module history,
            including completed, in-progress, and not started modules.
          </p>

          <p>
            <strong>Modules Tab:</strong> View all modules and track how many
            users have started, are in progress, or have completed each module.
            Click a module row to expand and see detailed user breakdowns.
          </p>

          <p>
            Use the search and filters to quickly find specific users or
            modules, and export data as needed.
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-gray-600">
        <strong>Your Institution:</strong> {institution} |{" "}
        <strong>Role Overseen:</strong> {overseeRole}
      </p>

      {/* TABS */}
      <div className="flex gap-2 justify-center">
        {["users", "modules"].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t as Tab)}
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

      {/* FILTER BAR */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3 w-full max-w-5xl mx-auto">
        {tab === "users" && (
          <input
            placeholder="Search by Name/Email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full"
          />
        )}

        {tab === "modules" && (
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
                {/* ===== GROUP OPTIONS ===== */}
                <div className="pb-2 border-b space-y-1">
                  {Object.entries(MODULE_GROUPS).map(([group, ids]) => {
                    const isGroupSelected = selectedGroups.includes(group);

                    return (
                      <label
                        key={group}
                        className="flex items-center gap-2 text-sm cursor-pointer font-semibold text-semcmeBlue"
                      >
                        <input
                          type="checkbox"
                          checked={isGroupSelected}
                          onChange={() => {
                            setSelectedGroups((prevGroups) => {
                              const isSelected = prevGroups.includes(group);

                              let newGroups;

                              if (isSelected) {
                                // ❌ remove group
                                newGroups = prevGroups.filter(
                                  (g) => g !== group,
                                );
                              } else {
                                // ✅ add group
                                newGroups = [...prevGroups, group];
                              }

                              // 🔥 REBUILD MODULE LIST BASED ON GROUPS
                              const newModuleSet = new Set<string>();

                              newGroups.forEach((g) => {
                                const group = g as ModuleGroupKey;

                                MODULE_GROUPS[group].forEach((id: string) => {
                                  newModuleSet.add(id);
                                });
                              });

                              setFilterSelectedModules(
                                Array.from(newModuleSet),
                              );

                              return newGroups;
                            });
                          }}
                        />
                        All {group}
                      </label>
                    );
                  })}
                </div>

                {/* ===== INDIVIDUAL MODULES ===== */}
                {allModules.map((m: any) => (
                  <label
                    key={m.id}
                    className="flex items-center gap-2 text-sm cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={filterSelectedModules.includes(m.id)}
                      onChange={() => {
                        setFilterSelectedModules((prev) =>
                          prev.includes(m.id)
                            ? prev.filter((id) => id !== m.id)
                            : [...prev, m.id],
                        );
                      }}
                    />
                    {m.title}
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          onClick={() => {
            if (tab === "users") {
              exportUsers();
            } else {
              exportModules();
            }
          }}
          className="px-4 py-2 bg-semcmeBlue text-white rounded-md hover:bg-semcmeBlue/90"
        >
          Export CSV
        </button>
      </section>

      <p className="text-center text-sm text-gray-500 mb-1">
        Click a row to expand details.
      </p>

      {/* TABLE */}
      <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white">
        {tab === "users" ? (
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
              {filteredUsers.map((u: any) => (
                <>
                  {/* MAIN ROW */}
                  <tr
                    key={u.user_id}
                    className="border-b cursor-pointer hover:bg-gray-100"
                    onClick={() =>
                      setSelectedUserId(
                        selectedUserId === u.user_id ? null : u.user_id,
                      )
                    }
                  >
                    <td className="p-3">{u.name}</td>
                    <td>{u.email}</td>
                    <td>{u.institution}</td>
                    <td>{u.role}</td>
                    <td>{u.completedCount}</td>
                    <td>{u.inProgressCount}</td>
                  </tr>

                  {/* EXPANDED ROW */}
                  {selectedUserId === u.user_id && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={6} className="p-4">
                        <UserDetailPanel user={u} allModules={allModules} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        ) : (
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
              {modules.map((m: any) => (
                <>
                  {/* MAIN ROW */}
                  <tr
                    key={m.id}
                    className="border-b border-gray-200 hover:bg-gray-100 cursor-pointer"
                    onClick={() =>
                      setSelectedModuleId(
                        selectedModuleId === m.id ? null : m.id,
                      )
                    }
                  >
                    <td className="p-3">{m.title}</td>
                    <td className="p-3">{m.skill_level || "—"}</td>
                    <td className="p-3">{m.started}</td>
                    <td className="p-3">{m.inProgress}</td>
                    <td className="p-3">{m.completed}</td>
                  </tr>

                  {/* EXPANDED ROW */}
                  {selectedModuleId === m.id && (
                    <tr className="bg-gray-50 border-b border-gray-200">
                      <td colSpan={5} className="p-4">
                        <ModuleDetailPanel module={m} users={users} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* SUPPORT */}
      <div className="text-center text-sm text-gray-600">
        Need help? your@email.com | your@email.com
      </div>
    </div>
  );
}

function UserDetailPanel({
  user,
  allModules,
}: {
  user: any;
  allModules: any[];
}) {
  const completed = user.modules.filter((m: any) => m.status === "completed");
  const inProgress = user.modules.filter(
    (m: any) => m.status === "in_progress",
  );

  const notStarted = allModules.filter(
    (mod: any) => !user.modules.some((m: any) => m.module_id === mod.id),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
      {/* LEFT COLUMN */}
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-semcmeBlue">{user.name}</h2>

        <p>
          <strong>Email:</strong> {user.email}
        </p>

        <p>
          <strong>Institution:</strong> {user.institution}
        </p>

        <p>
          <strong>Account Created:</strong>{" "}
          {user.created_at
            ? new Date(user.created_at).toLocaleDateString()
            : "—"}
        </p>

        <p>
          <strong>Total Modules Completed:</strong> {user.completedCount}
        </p>

        {/* IN PROGRESS */}
        <div className="mt-10">
          <h3 className="font-semibold text-semcmeBlue">Modules In Progress</h3>

          {inProgress.length === 0 ? (
            <p className="text-xs text-gray-500">None.</p>
          ) : (
            <ul className="text-xs">
              {inProgress.map((m: any, idx: number) => (
                <li key={idx}>
                  <strong>{m.module_title ?? m.module_id}</strong> —{" "}
                  {m.progress_percent ?? 0}% complete
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* NOT STARTED */}
        <div>
          <h3 className="font-semibold text-semcmeBlue">Modules Not Started</h3>

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

      {/* RIGHT COLUMN */}
      <div className="space-y-4">
        {/* COMPLETED */}
        <div>
          <h3 className="font-semibold text-lg text-semcmeBlue mb-2">
            Completed Modules
          </h3>

          {completed.length === 0 ? (
            <p className="text-xs text-gray-500">None completed.</p>
          ) : (
            <ul className="text-xs space-y-2">
              {completed.map((m: any, idx: number) => (
                <li key={idx}>
                  <strong>{m.module_title ?? m.module_id}</strong>

                  <div>
                    - Completed:{" "}
                    {m.date_completed
                      ? new Date(m.date_completed).toLocaleDateString()
                      : "date unknown"}
                  </div>

                  <div>- Certificate Issued: {m.cert_url ? "Yes" : "No"}</div>

                  {m.cert_issued_at && (
                    <div>
                      - Certificate Issue Date:{" "}
                      {new Date(m.cert_issued_at).toLocaleDateString()}
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function ModuleDetailPanel({ module, users }: { module: any; users: any[] }) {
  const completedUsers = users.filter((u) =>
    u.modules.some(
      (m: any) => m.module_id === module.id && m.status === "completed",
    ),
  );

  const inProgressUsers = users.filter((u) =>
    u.modules.some(
      (m: any) => m.module_id === module.id && m.status === "in_progress",
    ),
  );

  const notStartedUsers = users.filter(
    (u) => !u.modules.some((m: any) => m.module_id === module.id),
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-700">
      {/* LEFT */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-semcmeBlue">
          {module.title}
        </h3>

        <p>
          <strong>Skill Level:</strong> {module.skill_level ?? "—"}
        </p>

        <p>
          <strong>Total Started:</strong> {module.started}
        </p>

        <p>
          <strong>Total Completed:</strong> {module.completed}
        </p>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        {/* COMPLETED USERS */}
        <div>
          <h4 className="font-semibold text-gray-800">Users Completed</h4>

          {completedUsers.length === 0 ? (
            <p className="text-xs text-gray-500">None.</p>
          ) : (
            <ul className="text-xs">
              {completedUsers.map((u: any) => (
                <li key={u.user_id}>
                  {u.name} ({u.email})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* IN PROGRESS */}
        <div>
          <h4 className="font-semibold text-gray-800">Users In Progress</h4>

          {inProgressUsers.length === 0 ? (
            <p className="text-xs text-gray-500">None.</p>
          ) : (
            <ul className="text-xs">
              {inProgressUsers.map((u: any) => (
                <li key={u.user_id}>
                  {u.name} ({u.email})
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* NOT STARTED */}
        <div>
          <h4 className="font-semibold text-gray-800">Users Not Started</h4>

          {notStartedUsers.length === 0 ? (
            <p className="text-xs text-gray-500">None.</p>
          ) : (
            <ul className="text-xs">
              {notStartedUsers.map((u: any) => (
                <li key={u.user_id}>
                  {u.name} ({u.email})
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
