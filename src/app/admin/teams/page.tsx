"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Users, Plus, Trash2, ShieldCheck, Loader2, X, User } from "lucide-react";

interface TeamItem {
  id: string;
  name: string;
  _count: {
    users: number;
  };
}

export default function AdminTeamsPage() {
  const [teams, setTeams] = useState<TeamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchTeams = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/teams");
      const data = await res.json();
      if (res.ok) {
        setTeams(data.teams);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, []);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim()) return;

    setSaving(true);
    try {
      const res = await fetch("/api/admin/teams", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTeamName }),
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewTeamName("");
        await fetchTeams();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to create team.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeam = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete team "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/teams?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        await fetchTeams();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Team Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
            Create and organize participating student teams for competitive cohorts.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <Link
            href="/admin/users"
            className="px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-bold transition-all flex items-center space-x-1.5"
          >
            <User className="w-4 h-4 text-cyan-500" />
            <span>Manage Users</span>
          </Link>
          <button
            onClick={() => setIsModalOpen(true)}
            type="button"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Create Team</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading teams...</p>
        </div>
      ) : teams.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <Users className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Teams Found
          </h3>
          <p className="text-xs text-slate-500">Create your first cohort team.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {teams.map((t) => (
            <div
              key={t.id}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 shadow-md flex flex-col justify-between space-y-4"
            >
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 flex items-center justify-center font-bold">
                    <Users className="w-5 h-5" />
                  </div>
                  <button
                    onClick={() => handleDeleteTeam(t.id, t.name)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Team"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <h3 className="text-base font-bold text-slate-900 dark:text-white pt-2">
                  {t.name}
                </h3>
              </div>

              <div className="pt-3 border-t border-slate-200 dark:border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">
                  {t._count.users} {t._count.users === 1 ? "Member" : "Members"}
                </span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400">
                  Enrolled
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal: Create Team */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Create New Team
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTeam} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Team Name *
                </label>
                <input
                  type="text"
                  required
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="e.g. Team Delta (Cloud Navigators)"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
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
                  {saving ? "Creating..." : "Create Team"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
