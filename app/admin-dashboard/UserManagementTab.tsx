// app/admin-dashboard/UserManagementTab.tsx

"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import InstitutionSelect from "./InstitutionSelect";
import { userRoles } from "@/lib/userRoles";

export interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  institution: string | null;
  institution_id: string | null;
}

export default function UserManagementTab({ institutions, onUserUpdated }: {
  institutions: { id: string; name: string }[];
  onUserUpdated: (user: UserRow) => void;
}) {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRow | null>(null);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const tableContainer = useRef<HTMLDivElement>(null);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const [institutionId, setInstitutionId] = useState("");
  const [details, setDetails] = useState({ firstName: "", lastName: "", email: "", role: "" });
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

  const handleUserUpdate = async () => {
    if (!editingUser || saving) return;
    setSaving(true);
    setError("");
    try {
      const res = await fetch("/api/admin/update-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: editingUser.id, institutionId: institutionId || null, ...details }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Unable to update user.");
      setUsers((previous) => previous.map((user) => user.id === editingUser.id
        ? { ...user, ...data }
        : user));
      onUserUpdated(data);
      setNotice(`Account updated for ${data.email}.${data.needsApproval ? " Institution Administrator access is pending approval." : ""}`);
      setEditingUser(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update user. Please try again.");
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
        Website admins can edit names, email addresses, institutions, and roles, or remove an account.
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
          onChange={(e) => {
            setSearch(e.target.value);
            if (tableContainer.current) tableContainer.current.scrollTop = 0;
          }}
          className="w-full md:w-1/2 border border-gray-300 rounded-md p-2 text-sm"
        />
      </div>

      {/* TABLE */}
      {/* Approximately 30 standard-height rows plus the column headings. */}
      <div ref={tableContainer}
        className="max-h-[92.5rem] overflow-auto rounded-lg border border-gray-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        role="region" aria-label="User management list" tabIndex={0}>
        <table className="w-full text-sm">
          <thead className="sticky top-0 z-10 border-b bg-white text-gray-800 text-base font-bold shadow-sm">
            <tr>
              <th className="py-2 pl-3 text-left">Name</th>
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
                className="h-12 border-b hover:bg-gray-50 transition"
              >
                <td className="py-2 pl-3">
                  {user.first_name} {user.last_name}
                </td>
                <td>{user.email}</td>
                <td>{user.institution || "-"}</td>
                <td>{user.role}</td>

                {/* DELETE BUTTON */}
                <td className="text-center">
                  <Button variant="outline" size="sm" className="mr-2"
                    disabled={user.role === "admin"}
                    aria-label={`Edit account for ${user.email}`}
                    onClick={() => {
                      setEditingUser(user);
                      setDetails({ firstName: user.first_name || "", lastName: user.last_name || "", email: user.email, role: user.role });
                      setInstitutionId(user.institution_id || "");
                      setError("");
                      setNotice("");
                    }}>
                    Edit user
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
        <DialogContent showCloseButton={!saving} className="max-h-[90vh] overflow-y-auto bg-white">
          <DialogTitle>Edit user account</DialogTitle>
          <DialogDescription>
            Update the account for {editingUser?.email}. Email changes also update the sign-in email.
            Institution changes affect which IA can see the user; role changes affect portal access.
          </DialogDescription>
          <form onSubmit={(event) => { event.preventDefault(); void handleUserUpdate(); }} className="space-y-4">
            <fieldset disabled={saving} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label htmlFor="edit-first-name" className="text-sm font-medium">First name
                  <input id="edit-first-name" required maxLength={150} value={details.firstName} onChange={(e) => setDetails({ ...details, firstName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
                </label>
                <label htmlFor="edit-last-name" className="text-sm font-medium">Last name
                  <input id="edit-last-name" required maxLength={150} value={details.lastName} onChange={(e) => setDetails({ ...details, lastName: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
                </label>
              </div>
              <label htmlFor="edit-email" className="block text-sm font-medium">Email address
                <input id="edit-email" type="email" required maxLength={254} value={details.email} onChange={(e) => setDetails({ ...details, email: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
              </label>
              <div>
                <label htmlFor="user-institution" className="mb-1 block text-sm font-medium">Institution</label>
                <InstitutionSelect institutions={[
                  { id: "", name: "No institution" },
                  ...institutions,
                  ...(editingUser?.institution_id && !institutions.some((item) => item.id === editingUser.institution_id)
                    ? [{ id: editingUser.institution_id, name: editingUser.institution || "Current institution" }] : []),
                ]} value={institutionId} disabled={saving} onChange={setInstitutionId} />
              </div>
              <label htmlFor="edit-role" className="block text-sm font-medium">Role / learner group
                <select id="edit-role" required value={details.role} onChange={(e) => setDetails({ ...details, role: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2">
                  <option value="" disabled>Select a role</option>
                  {!userRoles.some((role) => role === details.role) && details.role && <option value={details.role} disabled>{details.role} (select a current role)</option>}
                  {userRoles.map((role) => <option key={role} value={role}>{role === "Resident" ? "Resident / Fellow" : role}</option>)}
                </select>
              </label>
              {details.role === "Institution Administrator" && (editingUser?.role !== details.role || editingUser?.institution_id !== (institutionId || null)) && <p className="rounded-lg bg-blue-50 p-3 text-sm text-blue-900">Institution Administrator access will require approval in the Admin Approvals panel.</p>}
              <p className="text-sm text-gray-500">Module progress and existing certificates are preserved.</p>
            </fieldset>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <div className="flex justify-end gap-3">
              <Button type="button" variant="outline" disabled={saving} onClick={() => { setEditingUser(null); setError(""); }}>Cancel</Button>
              <Button type="submit" disabled={saving || !userRoles.some((role) => role === details.role)}>{saving ? "Saving..." : "Save changes"}</Button>
            </div>
          </form>
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
