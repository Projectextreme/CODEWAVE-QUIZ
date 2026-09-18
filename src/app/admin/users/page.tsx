"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { User, Users, Plus, ShieldCheck, Trash2, Edit3, Loader2, X, ArrowLeft } from "lucide-react";

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  teamId: string | null;
  teamName: string | null;
  totalAttempts: number;
}

interface TeamItem {
  id: string;
  name: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"USER" | "ADMIN">("USER");
  const [teamId, setTeamId] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [uRes, tRes] = await Promise.all([
        fetch("/api/admin/users"),
        fetch("/api/admin/teams"),
      ]);
      const [uData, tData] = await Promise.all([uRes.json(), tRes.json()]);

      if (uRes.ok) setUsers(uData.users);
      if (tRes.ok) setTeams(tData.teams);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenAdd = () => {
    setEditingUserId(null);
    setName("");
    setEmail("");
    setPassword("");
    setRole("USER");
    setTeamId("");
    setIsModalOpen(true);
  };

  const handleOpenEdit = (u: UserItem) => {
    setEditingUserId(u.id);
    setName(u.name);
    setEmail(u.email);
    setPassword("");
    setRole(u.role);
    setTeamId(u.teamId || "");
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editingUserId) {
        const res = await fetch("/api/admin/users", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingUserId,
            name,
            role,
            teamId: teamId || null,
            password: password || undefined,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          await fetchData();
        }
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name,
            email,
            password,
            role,
            teamId: teamId || null,
          }),
        });
        if (res.ok) {
          setIsModalOpen(false);
          await fetchData();
        } else {
          const d = await res.json();
          alert(d.error || "Failed to create user.");
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (u: UserItem) => {
    if (!confirm(`Delete user "${u.name}" (${u.email})?`)) return;
    try {
      const res = await fetch(`/api/admin/users?id=${u.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            User Accounts & Roles
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Manage participants, team assignments, and administrator privileges.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/teams"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all"
          >
            <Users className="w-4 h-4 text-sky-500" />
            <span>Manage Teams</span>
          </Link>
          <button
            onClick={handleOpenAdd}
            type="button"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading user accounts...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-50 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase tracking-wider text-[11px] font-bold">
                <tr>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Role</th>
                  <th className="px-6 py-4">Team</th>
                  <th className="px-6 py-4">Attempts</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800/80 text-slate-700 dark:text-slate-300 font-medium">
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="text-xs text-slate-400">{u.email}</div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      {u.role === "ADMIN" ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>ADMIN</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                          <span>STUDENT</span>
                        </span>
                      )}
                    </td>

                    <td className="px-6 py-4">
                      {u.teamName ? (
                        <span className="px-2.5 py-1 rounded-xl bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold">
                          {u.teamName}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-xs">No Team</span>
                      )}
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-900 dark:text-white">
                      {u.totalAttempts}
                    </td>

                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => handleOpenEdit(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit User"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(u)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                        title="Delete User"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingUserId ? "Edit User Account" : "Create User Account"}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              {!editingUserId && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  {editingUserId ? "New Password (leave blank to keep)" : "Password *"}
                </label>
                <input
                  type="password"
                  required={!editingUserId}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Role *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as "USER" | "ADMIN")}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="USER">Student (USER)</option>
                    <option value="ADMIN">Administrator (ADMIN)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Team Assignment
                  </label>
                  <select
                    value={teamId}
                    onChange={(e) => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="">No Team</option>
                    {teams.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md hover:bg-cyan-500 transition-all disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
