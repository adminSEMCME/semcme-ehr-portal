"use client";

import { useState, useEffect } from "react";

export default function AnnouncementsTab() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [cutoffDate, setCutoffDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [targetType, setTargetType] = useState<
    "all" | "existing" | "role" | "user"
  >("all");
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [targetEmail, setTargetEmail] = useState("");

  const ROLES = [
    "Medical Student",
    "Resident",
    "Practicing Physician/Faculty",
    "Nursing",
    "Institution Administrator",
    "Other",
  ];

  async function loadAnnouncements() {
    const res = await fetch("/api/admin/get-announcements");
    const data = await res.json();
    setAnnouncements(data || []);
  }

  useEffect(() => {
    loadAnnouncements();
  }, []);

  async function handleSend() {
    if (!title || !message) {
      alert("Title and message are required.");
      return;
    }

    if (targetType === "existing" && !cutoffDate) {
      alert("Please select a cutoff date for existing users.");
      return;
    }

    if (targetType === "role" && selectedRoles.length === 0) {
      alert("Please select at least one role.");
      return;
    }

    if (targetType === "user" && !targetEmail.trim()) {
      alert("Please enter a user email.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch("/api/admin/create-announcement", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          message,
          target_type: targetType,
          cutoff_date: targetType === "existing" ? cutoffDate : null,
          target_roles: targetType === "role" ? selectedRoles : [],
          target_email: targetType === "user" ? targetEmail : null,
        }),
      });

      if (!res.ok) throw new Error("Failed to create announcement");

      alert("✅ Announcement sent successfully");

      // reset form
      setTitle("");
      setMessage("");
      setTargetType("all");
      setCutoffDate("");

      // 🔥 reload announcements
      await loadAnnouncements();
    } catch (err) {
      console.error(err);
      alert("Error sending announcement");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    const confirmDelete = confirm(
      "Are you sure you want to remove this announcement?",
    );
    if (!confirmDelete) return;

    await fetch("/api/admin/delete-announcement", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ id }),
    });

    loadAnnouncements();
  }

  return (
    <div className="max-w-3xl mx-auto space-y-10 mb-20">
      {/* ================= CREATE ANNOUNCEMENT ================= */}
      <div className="bg-white p-6 rounded-lg shadow space-y-6">
        <h2 className="text-2xl font-bold text-semcmeBlue">
          Send Announcement
        </h2>

        {/* TITLE */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            className="w-full border rounded-md px-3 py-2"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Announcement Title"
          />
        </div>

        {/* MESSAGE */}
        <div>
          <label className="block text-sm font-medium mb-1">Message</label>
          <textarea
            className="w-full border rounded-md px-3 py-2 h-32"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Write your announcement here..."
          />
        </div>

        {/* TARGET TYPE */}
        <div>
          <label className="block text-sm font-medium mb-2">Target Users</label>

          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "all"}
                onChange={() => setTargetType("all")}
              />
              All Users
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "existing"}
                onChange={() => setTargetType("existing")}
              />
              Existing Users Only
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "role"}
                onChange={() => setTargetType("role")}
              />
              Target by Role
            </label>

            <label className="flex items-center gap-2">
              <input
                type="radio"
                checked={targetType === "user"}
                onChange={() => setTargetType("user")}
              />
              Specific User
            </label>
          </div>
        </div>

        {targetType === "role" && (
          <div>
            <label className="block text-sm font-medium mb-2">
              Select Roles
            </label>

            <div className="grid grid-cols-2 gap-2">
              {ROLES.map((role) => (
                <label key={role} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedRoles.includes(role)}
                    onChange={() => {
                      setSelectedRoles((prev) =>
                        prev.includes(role)
                          ? prev.filter((r) => r !== role)
                          : [...prev, role],
                      );
                    }}
                  />
                  {role}
                </label>
              ))}
            </div>
          </div>
        )}

        {targetType === "user" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Target User Email
            </label>
            <input
              type="email"
              className="w-full border rounded-md px-3 py-2"
              placeholder="Enter user email"
              value={targetEmail}
              onChange={(e) => setTargetEmail(e.target.value)}
            />
          </div>
        )}

        {/* CUTOFF DATE */}
        {targetType === "existing" && (
          <div>
            <label className="block text-sm font-medium mb-1">
              Users Created Before
            </label>
            <input
              type="date"
              className="w-full border rounded-md px-3 py-2"
              value={cutoffDate}
              onChange={(e) => setCutoffDate(e.target.value)}
            />
          </div>
        )}

        {/* BUTTON */}
        <button
          onClick={handleSend}
          disabled={loading}
          className="w-full bg-semcmeBlue text-white py-2 rounded-md hover:bg-blue-800 transition"
        >
          {loading ? "Sending..." : "Send Announcement"}
        </button>
      </div>

      {/* ================= ANNOUNCEMENTS LIST ================= */}
      <div>
        <h3 className="text-xl font-semibold text-semcmeBlue mb-4">
          Current Announcements
        </h3>

        {announcements.length === 0 ? (
          <p className="text-gray-500 text-sm">No announcements found.</p>
        ) : (
          <div className="space-y-4">
            {announcements.map((a) => (
              <div
                key={a.id}
                className="border rounded-md p-4 bg-gray-50 flex flex-col gap-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-semcmeBlue">{a.title}</p>

                    <p className="text-sm text-gray-600 whitespace-pre-wrap">
                      {a.message}
                    </p>

                    <p className="text-xs text-gray-400 mt-1">
                      Created: {new Date(a.created_at).toLocaleDateString()}
                    </p>

                    <p className="text-xs mt-1">
                      Target: {a.target_type === "all" && "All Users"}
                      {a.target_type === "existing" && "Existing Users Only"}
                      {a.target_type === "role" &&
                        `Roles: ${a.target_roles?.join(", ")}`}
                      {a.target_type === "user" &&
                        `User: ${a.target_user_email}`}
                    </p>

                    <p className="text-xs mt-1">
                      Status:{" "}
                      <span
                        className={a.active ? "text-green-600" : "text-red-500"}
                      >
                        {a.active ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>

                  <button
                    onClick={() => handleDelete(a.id)}
                    className="text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
