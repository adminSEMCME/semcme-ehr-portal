// app/admin-dashboard/UserManagementTab.tsx

"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InstitutionSelect from "./InstitutionSelect";

interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institution: string | null;
  institution_id: string | null;
}

export default function UserManagementTab({ institutions, onInstitutionUpdated }: {
  institutions: { id: string; name: string }[];
  onInstitutionUpdated: (userId: string, institution: string) => void;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [institutionId, setInstitutionId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [loadingUsers, setLoadingUsers] = useState(true);

  // Fetch users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/admin/get-users");
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Unable to load users.");
        setUsers(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load users.");
      } finally {
        setLoadingUsers(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter((user) => {
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase();
    const email = user.email.toLowerCase();
    const query = search.toLowerCase();

    return fullName.includes(query) || email.includes(query);
  });

  const handleInstitutionUpdate = async () => {
    if (!editingUser || !institutionId || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/update-user-institution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, institutionId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update institution.");
      setUsers((previous) => previous.map((user) => user.id === editingUser.id
        ? { ...user, institution_id: data.institution_id, institution: data.institution }
        : user));
      onInstitutionUpdated(editingUser.id, data.institution);
      setNotice(`Institution updated for ${editingUser.email} to ${data.institution}.`);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update institution. Please try again.");
    } finally {
      setSaving(false);
    }
  };

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
      <p className="text-sm text-gray-600 text-center mb-4">
        Website admins can correct a user’s institution or remove an account.
      </p>
      {notice && <p role="status" className="mb-4 text-green-800">{notice}</p>}
      {error && !editingUser && <p role="alert" className="mb-4 text-red-700">{error}</p>}
      {loadingUsers && <p role="status">Loading users...</p>}

      <div className="mb-4 text-center">
        <input
          type="text"
          placeholder="Search by name or email..."
          aria-label="Search users by name or email"
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
              <th>Actions</th>
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
                  <Button variant="outline" size="sm" className="mr-2"
                    disabled={!institutions.length}
                    aria-label={`Edit institution for ${user.email}`}
                    onClick={() => {
                      setEditingUser(user);
                      setInstitutionId(institutions.some((institution) => institution.id === user.institution_id)
                        ? user.institution_id! : "");
                      setError("");
                      setNotice("");
                    }}>
                    Edit institution
                  </Button>
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

      <Dialog open={!!editingUser} onOpenChange={(open) => {
        if (!open && !saving) { setEditingUser(null); setError(""); }
      }}>
        <DialogContent showCloseButton={!saving} className="bg-white">
          <DialogTitle>Edit institution</DialogTitle>
          <DialogDescription>
            Update the institution for {editingUser?.first_name} {editingUser?.last_name} ({editingUser?.email}).
            Module progress and certificates will be preserved. This changes which institution administrator can see the user.
          </DialogDescription>
          <p className="text-sm">Current institution: <strong>{editingUser?.institution || "None"}</strong></p>
          <label htmlFor="user-institution" className="text-sm font-medium">New institution</label>
          <InstitutionSelect institutions={institutions} value={institutionId}
            disabled={saving} onChange={setInstitutionId} />
          {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <Button variant="outline" disabled={saving} onClick={() => { setEditingUser(null); setError(""); }}>Cancel</Button>
            <Button disabled={saving || !institutionId || institutionId === editingUser?.institution_id}
              onClick={handleInstitutionUpdate}>{saving ? "Saving..." : "Save institution"}</Button>
          </div>
        </DialogContent>
      </Dialog>

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
