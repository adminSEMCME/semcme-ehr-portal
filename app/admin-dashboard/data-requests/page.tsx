"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";

type Request = {
  id: string;
  created_at: string;
  report_type: string;
  individual_user_email: string | null;
  module_scope: string;
  selected_modules: string[] | null;
  additional_notes: string | null;
  status: string;
  institution_id: string;
};

export default function DataRequestsPage() {
  const [requests, setRequests] = useState<Request[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    setLoading(true);

    const { data, error } = await supabase
      .from("institution_data_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRequests(data);
    }

    setLoading(false);
  }

  const filteredRequests =
    statusFilter === "all"
      ? requests
      : requests.filter((r) => r.status === statusFilter);

  async function updateStatus(id: string, newStatus: string) {
    const { error } = await supabase
      .from("institution_data_requests")
      .update({ status: newStatus })
      .eq("id", id);

    if (!error) {
      loadRequests();
    }
  }

  return (
    <main className="min-h-screen p-10 bg-white">
      <h1 className="text-3xl font-bold mb-8">Institution Data Requests</h1>

      {/* FILTER */}
      <div className="mb-6">
        <label className="mr-3 font-medium">Filter by Status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="border px-3 py-2 rounded-md"
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="denied">Denied</option>
          <option value="completed">Completed</option>
        </select>
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : (
        <div className="overflow-x-auto border rounded-md">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-3 text-left">Date</th>
                <th className="p-3 text-left">Report Type</th>
                <th className="p-3 text-left">Institution</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id} className="border-t">
                  <td className="p-3">
                    {new Date(req.created_at).toLocaleDateString()}
                  </td>

                  <td className="p-3 capitalize">{req.report_type}</td>

                  <td className="p-3">{req.institution_id}</td>

                  <td className="p-3 capitalize">{req.status}</td>

                  <td className="p-3 space-x-2">
                    <button
                      onClick={() => updateStatus(req.id, "approved")}
                      className="px-3 py-1 bg-green-600 text-white rounded"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => updateStatus(req.id, "denied")}
                      className="px-3 py-1 bg-red-600 text-white rounded"
                    >
                      Deny
                    </button>

                    <button
                      onClick={() => updateStatus(req.id, "completed")}
                      className="px-3 py-1 bg-blue-600 text-white rounded"
                    >
                      Complete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}
