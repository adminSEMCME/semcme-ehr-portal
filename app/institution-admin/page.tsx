// app/institution-admin/page.tsx
"use client";

import React, { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/lib/supabaseClient";
import { Button } from "@/components/ui/button";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import {
  focusFirstDescendant,
  handleDropdownKeyDown,
} from "@/lib/keyboardNavigation";

type Tab = "users" | "modules";
type SortDirection = "asc" | "desc";
type UserSortKey = "name" | "email";

export default function InstitutionAdminPage() {
  const [tab, setTab] = useState<Tab>("users");

  const [institution, setInstitution] = useState<string | null>(null);

  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [filterModuleId, setFilterModuleId] = useState<string>("all");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [userSort, setUserSort] = useState<{
    key: UserSortKey;
    direction: SortDirection;
  }>({ key: "name", direction: "asc" });

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
        .select("institution_id")
        .eq("id", user.id)
        .single();

      let institutionName = null;

      if (profile?.institution_id) {
        const { data: inst } = await supabase
          .from("institutions")
          .select("name")
          .eq("id", profile.institution_id)
          .single();

        institutionName = inst?.name ?? null;
      }

      setInstitution(institutionName);
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
  const userModuleRows = useMemo(() => {
    return analytics?.userModules ?? [];
  }, [analytics]);

  /* ---------------- BUILD USERS ---------------- */
  const users = useMemo(() => {
    const map = new Map();

    for (const row of userModuleRows) {
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
  }, [userModuleRows]);

  /* ---------------- FILTER USERS (UI FILTER) ---------------- */
  const filteredUsers = useMemo(() => {
    return users.filter((u: any) => {
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
  }, [users, search, filterModuleId]);

  const sortedUsers = useMemo(() => {
    return [...filteredUsers].sort((a: any, b: any) => {
      const comparison = String(a[userSort.key] ?? "").localeCompare(
        String(b[userSort.key] ?? ""),
        undefined,
        { sensitivity: "base" },
      );

      return userSort.direction === "asc" ? comparison : -comparison;
    });
  }, [filteredUsers, userSort]);

  /* ---------------- BUILD MODULES ---------------- */
  const modules = useMemo(() => {
    const allModules = analytics?.modules ?? [];

    let base = allModules.map((mod: any) => {
      const rows = userModuleRows.filter((r: any) => r.module_id === mod.id);

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
  }, [analytics, userModuleRows, filterSelectedModules]);

  const toggleUserSort = (key: UserSortKey) => {
    setUserSort((current) => ({
      key,
      direction:
        current.key === key
          ? current.direction === "asc"
            ? "desc"
            : "asc"
          : "asc",
    }));
  };

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
        total_not_started: Math.max(users.length - m.started, 0),
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
    <div className="space-y-8 text-gray-900">
      {(loading || !analytics || !institution) && (
        <div className="text-center py-10 text-gray-700">Loading...</div>
      )}
      {/* TITLE */}
      <h1 className="text-4xl font-bold text-semcmeBlue text-center">
        Institution Administrator Dashboard
      </h1>

      {/* INFO SECTION */}
      <section className="max-w-5xl mx-auto overflow-hidden rounded-xl border border-blue-200 bg-blue-50 text-sm text-gray-900">
        <button
          type="button"
          onClick={() => setIsInstructionsOpen((current) => !current)}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-lg font-semibold text-semcmeBlue transition-colors hover:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-semcmeBlue"
          aria-expanded={isInstructionsOpen}
          aria-controls="ia-dashboard-instructions"
        >
          <span>How to Use This Dashboard</span>
          {isInstructionsOpen ? (
            <ChevronDown aria-hidden="true" className="h-5 w-5 shrink-0" />
          ) : (
            <ChevronRight aria-hidden="true" className="h-5 w-5 shrink-0" />
          )}
        </button>

        {isInstructionsOpen && (
          <div
            id="ia-dashboard-instructions"
            className="space-y-3 border-t border-blue-200 px-5 py-4"
          >
            <p>
              This dashboard allows you to monitor user progress within your
              institution.
            </p>

            <div className="space-y-2">
              <p>
                <strong>Users Tab:</strong> View all users in your institution.
                Click a user row to expand their full module history, including
                completed, in-progress, and not started modules.
              </p>

              <p>
                <strong>Modules Tab:</strong> View all modules and track how
                many users are in progress, have completed, or have not started
                each module. Click a module row to expand and see detailed user
                breakdowns.
              </p>

              <p>
                Use the search and filters to quickly find specific users or
                modules, and export data as needed.
              </p>
            </div>
          </div>
        )}
      </section>

      <p className="text-center text-sm text-gray-800">
        <strong>Your Institution:</strong> {institution}
      </p>

      {/* TABS */}
      <div className="flex gap-2 justify-center">
        {["users", "modules"].map((t) => (
          <Button
            key={t}
            onClick={() => setTab(t as Tab)}
            variant={tab === t ? "default" : "outline"}
            size="sm"
            className="rounded-full font-semibold"
          >
            {t[0].toUpperCase() + t.slice(1)}
          </Button>
        ))}
      </div>

      {/* FILTER BAR */}
      <section className="flex flex-col md:flex-row items-center justify-center gap-4 mb-3 w-full max-w-5xl mx-auto">
        {tab === "users" && (
          <>
            <div className="flex w-full items-center justify-between gap-3 rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm md:w-auto md:min-w-36">
              <span className="text-xs font-semibold uppercase tracking-wide text-gray-700">
                Total Users
              </span>
              <span className="text-xl font-bold tabular-nums text-semcmeBlue">
                {users.length}
              </span>
            </div>
            <input
              placeholder="Search by Name/Email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="flex-1 px-3 py-2 rounded-md border border-gray-300 w-full text-gray-900 placeholder:text-gray-600"
            />
          </>
        )}

        {tab === "modules" && (
          <div ref={moduleDropdownRef} className="relative flex-1">
            <Button
              type="button"
              onClick={() => setIsModuleDropdownOpen((prev) => !prev)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setIsModuleDropdownOpen(true);
                  focusFirstDescendant(
                    moduleDropdownRef.current,
                    "[data-dropdown-menu]",
                  );
                }
              }}
              variant="dropdown"
              size="md"
              className="border border-gray-300 text-left"
            >
              {filterSelectedModules.length === 0
                ? "Select Modules"
                : `${filterSelectedModules.length} Module(s) Selected`}
            </Button>

            {isModuleDropdownOpen && (
              <div
                data-dropdown-menu
                className="absolute z-30 mt-2 w-full bg-white border border-gray-300 rounded-md shadow-md max-h-60 overflow-y-auto p-3 space-y-2"
                onKeyDown={(e) =>
                  handleDropdownKeyDown(e, () =>
                    setIsModuleDropdownOpen(false),
                  )
                }
              >
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

        <Button
          onClick={() => {
            if (tab === "users") {
              exportUsers();
            } else {
              exportModules();
            }
          }}
          size="md"
        >
          Export CSV
        </Button>
      </section>

      <p className="text-center text-sm text-gray-700 mb-1">
        Click a row to expand details.
      </p>

      {/* TABLE */}
      <div className="overflow-x-auto border border-gray-300 rounded-xl shadow-sm bg-white">
        {tab === "users" ? (
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-semcmeBlue text-white">
              <tr>
                <SortableHeader
                  label="Name"
                  active={userSort.key === "name"}
                  direction={userSort.direction}
                  onClick={() => toggleUserSort("name")}
                />
                <SortableHeader
                  label="Email"
                  active={userSort.key === "email"}
                  direction={userSort.direction}
                  onClick={() => toggleUserSort("email")}
                />
                <th className="p-3 text-left">Institution</th>
                <th className="p-3 text-left">Role</th>
                <th className="p-3 text-right">Completed</th>
                <th className="p-3 text-right">In Progress</th>
              </tr>
            </thead>
            <tbody>
              {sortedUsers.map((u: any, index: number) => {
                return (
                  <React.Fragment key={`user-${u.user_id}`}>
                    {/* MAIN ROW */}
                    <tr
                      className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} cursor-pointer border-b border-gray-200 transition-colors hover:bg-blue-100 focus-visible:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-semcmeBlue`}
                      onClick={() =>
                        setSelectedUserId(
                          selectedUserId === u.user_id ? null : u.user_id,
                        )
                      }
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          setSelectedUserId(
                            selectedUserId === u.user_id ? null : u.user_id,
                          );
                        }
                      }}
                      role="button"
                      tabIndex={0}
                      aria-expanded={selectedUserId === u.user_id}
                      title={`View details for ${u.name}`}
                    >
                      <td className="p-3 font-medium">
                        <span className="flex items-center gap-2">
                          {selectedUserId === u.user_id ? (
                            <ChevronDown
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-semcmeBlue"
                            />
                          ) : (
                            <ChevronRight
                              aria-hidden="true"
                              className="h-4 w-4 shrink-0 text-gray-600"
                            />
                          )}
                          {u.name}
                        </span>
                      </td>
                      <td className="p-3">{u.email}</td>
                      <td className="p-3">{u.institution}</td>
                      <td className="p-3">{u.role}</td>
                      <td className="p-3 text-right">
                        <CompletionCount value={u.completedCount} />
                      </td>
                      <td className="p-3 text-right font-medium tabular-nums">
                        {u.inProgressCount}
                      </td>
                    </tr>

                    {/* EXPANDED ROW */}
                    {selectedUserId === u.user_id && (
                      <tr className="border-b border-blue-200 bg-blue-50">
                        <td colSpan={6} className="p-4">
                          <UserDetailPanel user={u} allModules={allModules} />
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <table className="min-w-full text-sm text-gray-900">
            <thead className="bg-semcmeBlue text-white">
              <tr>
                <th className="p-3 text-left">Module</th>
                <th className="p-3 text-left">Skill Level</th>
                <th className="p-3 text-right">Not Started</th>
                <th className="p-3 text-right">In Progress</th>
                <th className="p-3 text-right">Completed</th>
              </tr>
            </thead>
            <tbody>
              {modules.map((m: any, index: number) => (
                <React.Fragment key={m.id}>
                  {/* MAIN ROW */}
                  <tr
                    key={m.id}
                    className={`${index % 2 === 0 ? "bg-white" : "bg-slate-50"} cursor-pointer border-b border-gray-200 transition-colors hover:bg-blue-100 focus-visible:bg-blue-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-semcmeBlue`}
                    onClick={() =>
                      setSelectedModuleId(
                        selectedModuleId === m.id ? null : m.id,
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        setSelectedModuleId(
                          selectedModuleId === m.id ? null : m.id,
                        );
                      }
                    }}
                    role="button"
                    tabIndex={0}
                    aria-expanded={selectedModuleId === m.id}
                    title={`View details for ${m.title}`}
                  >
                    <td className="p-3 font-medium">
                      <span className="flex items-center gap-2">
                        {selectedModuleId === m.id ? (
                          <ChevronDown
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-semcmeBlue"
                          />
                        ) : (
                          <ChevronRight
                            aria-hidden="true"
                            className="h-4 w-4 shrink-0 text-gray-600"
                          />
                        )}
                        {m.title}
                      </span>
                    </td>
                    <td className="p-3">{m.skill_level || "—"}</td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {Math.max(users.length - m.started, 0)}
                    </td>
                    <td className="p-3 text-right font-medium tabular-nums">
                      {m.inProgress}
                    </td>
                    <td className="p-3 text-right">
                      <CompletionCount value={m.completed} />
                    </td>
                  </tr>

                  {/* EXPANDED ROW */}
                  {selectedModuleId === m.id && (
                    <tr className="border-b border-blue-200 bg-blue-50">
                      <td colSpan={5} className="p-4">
                        <ModuleDetailPanel module={m} users={users} />
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <p className="text-sm text-gray-800 text-center">
        <strong>Need Help?</strong>{" "}
        <a
          href="/support/program"
          className="text-semcmeBlue hover:underline font-medium"
          title="Go to program support form"
        >
          Program Support
        </a>{" "}
        |{" "}
        <a
          href="/support/technical"
          className="text-semcmeBlue hover:underline font-medium"
          title="Go to technical support form"
        >
          Technical Support
        </a>
      </p>
    </div>
  );
}

function SortableHeader({
  label,
  active,
  direction,
  onClick,
}: {
  label: string;
  active: boolean;
  direction: SortDirection;
  onClick: () => void;
}) {
  return (
    <th
      scope="col"
      aria-sort={
        active ? (direction === "asc" ? "ascending" : "descending") : "none"
      }
      className="p-0 text-left"
    >
      <button
        type="button"
        onClick={onClick}
        className="flex w-full items-center justify-start gap-2 p-3 text-left font-semibold transition-colors hover:bg-blue-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white"
      >
        <span>{label}</span>
        {active ? (
          direction === "asc" ? (
            <ArrowUp aria-hidden="true" className="h-4 w-4" />
          ) : (
            <ArrowDown aria-hidden="true" className="h-4 w-4" />
          )
        ) : (
          <ArrowUpDown aria-hidden="true" className="h-4 w-4 opacity-70" />
        )}
      </button>
    </th>
  );
}

function CompletionCount({ value }: { value: number }) {
  return (
    <span className="inline-flex min-w-8 items-center justify-center rounded-full bg-emerald-100 px-2.5 py-1 font-bold tabular-nums text-emerald-800">
      {value}
    </span>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-900">
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
            <p className="text-xs text-gray-700">None.</p>
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
            <p className="text-xs text-gray-700">None.</p>
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
            <p className="text-xs text-gray-700">None completed.</p>
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
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-900">
      {/* LEFT */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-semcmeBlue">
          {module.title}
        </h3>

        <p>
          <strong>Skill Level:</strong> {module.skill_level ?? "—"}
        </p>

        <p>
          <strong>Total Not Started:</strong> {notStartedUsers.length}
        </p>

        <p>
          <strong>Total In Progress:</strong> {inProgressUsers.length}
        </p>

        <p>
          <strong>Total Completed:</strong> {completedUsers.length}
        </p>
      </div>

      {/* RIGHT */}
      <div className="space-y-4">
        {/* COMPLETED USERS */}
        <div>
          <h4 className="font-semibold text-gray-800">Users Completed</h4>

          {completedUsers.length === 0 ? (
            <p className="text-xs text-gray-700">None.</p>
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
            <p className="text-xs text-gray-700">None.</p>
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
            <p className="text-xs text-gray-700">None.</p>
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
