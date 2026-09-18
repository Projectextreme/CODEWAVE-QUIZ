"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "./ThemeToggle";
import {
  Layers,
  LogOut,
  User as UserIcon,
  ShieldAlert,
  BarChart3,
  Award,
  BookOpen,
  Menu,
  X,
} from "lucide-react";

interface NavbarProps {
  user?: {
    id?: string;
    userId?: string;
    name: string;
    email: string;
    role?: "USER" | "ADMIN" | string | null;
    team?: { id: string; name: string } | null;
    teamId?: string | null;
  } | null;
}

export function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      // Hard redirect so server-side session cookie is re-read fresh in production
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout error", err);
      window.location.href = "/login";
    }
  };

  const isAdmin = user?.role === "ADMIN";

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <div className="flex items-center space-x-3">
            <Link
              href={isAdmin ? "/admin" : "/"}
              className="flex items-center space-x-2.5 group"
            >
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-600 via-sky-500 to-teal-400 flex items-center justify-center text-white font-bold shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-1.5">
                Semaphore <span className="text-cyan-500 text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">Assessment</span>
              </span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          {user && (
            <div className="hidden md:flex items-center space-x-1 lg:space-x-3">
              {isAdmin ? (
                <>
                  <Link
                    href="/admin"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
                      pathname === "/admin"
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/admin/quizzes"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
                      pathname.startsWith("/admin/quizzes")
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Quizzes</span>
                  </Link>

                  <Link
                    href="/admin/teams"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
                      pathname.startsWith("/admin/teams")
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <UserIcon className="w-4 h-4" />
                    <span>Teams & Users</span>
                  </Link>

                  <Link
                    href="/admin/leaderboard"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs lg:text-sm font-semibold transition-colors ${
                      pathname.startsWith("/admin/leaderboard")
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Award className="w-4 h-4" />
                    <span>Leaderboard</span>
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                      pathname === "/"
                        ? "bg-cyan-500/10 text-cyan-600 dark:text-cyan-400"
                        : "text-slate-600 dark:text-slate-300 hover:text-cyan-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                    }`}
                  >
                    <BookOpen className="w-4 h-4" />
                    <span>Assessment Portal</span>
                  </Link>
                </>
              )}
            </div>
          )}

          {/* User Profile & Actions */}
          <div className="hidden md:flex items-center space-x-3">
            <ThemeToggle />

            {user ? (
              <div className="flex items-center space-x-3 pl-3 border-l border-slate-200 dark:border-slate-800">
                <div className="flex flex-col text-right">
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {user.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isAdmin ? (
                      <span className="text-cyan-500 font-semibold flex items-center justify-end gap-1">
                        <ShieldAlert className="w-3 h-3" /> Admin
                      </span>
                    ) : (
                      user.team?.name || user.email
                    )}
                  </span>
                </div>

                <button
                  onClick={handleLogout}
                  type="button"
                  className="p-2 rounded-xl text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link
                  href="/login"
                  className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white shadow-md shadow-cyan-600/20 transition-all"
                >
                  Join Quiz
                </Link>
              </div>
            )}
          </div>

          {/* Mobile hamburger button */}
          <div className="flex items-center space-x-2 md:hidden">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              type="button"
              className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-4 space-y-3">
          {user ? (
            <>
              <div className="pb-3 border-b border-slate-200 dark:border-slate-800">
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{user.name}</p>
                <p className="text-xs text-slate-500">{user.email} {user.team ? `• ${user.team.name}` : ""}</p>
              </div>

              {isAdmin ? (
                <div className="space-y-1">
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10"
                  >
                    Dashboard
                  </Link>
                  <Link
                    href="/admin/quizzes"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10"
                  >
                    Quizzes
                  </Link>
                  <Link
                    href="/admin/teams"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10"
                  >
                    Teams & Users
                  </Link>
                  <Link
                    href="/admin/leaderboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10"
                  >
                    Leaderboard
                  </Link>
                </div>
              ) : (
                <div className="space-y-1">
                  <Link
                    href="/"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-cyan-500/10"
                  >
                    Assessment Portal
                  </Link>
                </div>
              )}

              <button
                onClick={handleLogout}
                type="button"
                className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-500/10 border border-rose-500/20"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </>
          ) : (
            <div className="text-center">
              <Link
                href="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center py-2.5 rounded-xl bg-cyan-600 text-white text-sm font-bold shadow-md"
              >
                Join Assessment
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
