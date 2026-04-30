// app/admin-dashboard/UserManagementTab.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institution: string | null;
}

export default function UserManagementTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      const res = await fetch("/api/admin/get-users");
      const data = await res.json();
      setUsers(data || []);
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = search.toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  const handleDelete = async () => {
    if (!selectedUser) return;

    if (confirmEmail !== selectedUser.email) {
      alert("Email does not match.");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ userId: selectedUser.id }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      alert(data.error || "Failed to delete user");
      return;
    }

    // Remove user from UI
    setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
    setSelectedUser(null);
    setConfirmEmail("");
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 w-full">
      <h2 className="text-xl font-semibold text-semcmeBlue mb-4 text-center">
        User Management
      </h2>

      <div className="mb-4 text-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full md:w-1/2 border border-gray-300 rounded-md p-2 text-sm"
        />
      </div>

      {/* TABLE */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b text-gray-800 text-base font-bold">
            <tr>
              <th className="py-2 text-left">Name</th>
              <th className="text-left">Email</th>
              <th className="text-left">Institution</th>
              <th className="text-left">Role</th>
              <th>Delete</th>
            </tr>
          </thead>

          <tbody>
            {filteredUsers.map((user) => (
              <tr
                key={user.id}
                className="border-b hover:bg-gray-50 transition"
              >
                <td className="py-2">
                  {user.first_name} {user.last_name}
                </td>
                <td>{user.email}</td>
                <td>{user.institution || "-"}</td>
                <td>{user.role}</td>

                {/* DELETE BUTTON */}
                <td className="text-center">
                  <Button
                    onClick={() => setSelectedUser(user)}
                    variant="ghost"
                    size="icon-sm"
                    className="text-red-600 hover:text-red-800"
                    aria-label={`Delete ${user.email}`}
                  >
                    ✕
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {selectedUser && (
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
          onClick={() => setSelectedUser(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-md w-full shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-lg font-semibold text-red-600 mb-3">
              Confirm Account Deletion
            </h3>

            <p className="text-sm text-gray-700 mb-4">
              This action is permanent and cannot be undone.
              <br />
              <br />
              Type the following to confirm:
              <br />
              <strong>{selectedUser.email}</strong>
            </p>

            <input
              type="text"
              value={confirmEmail}
              onChange={(e) => setConfirmEmail(e.target.value)}
              placeholder="Enter email to confirm"
              className="w-full border p-2 rounded mb-4"
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setSelectedUser(null)}>
                Cancel
              </Button>

              <Button
                onClick={handleDelete}
                variant="destructive"
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
