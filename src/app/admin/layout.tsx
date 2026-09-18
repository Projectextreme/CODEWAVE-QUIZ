import React from "react";
import { getCurrentUser } from "@/lib/auth";
import { Navbar } from "@/components/layout/Navbar";
import { AdminLoginForm } from "@/components/admin/AdminLoginForm";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user || user.role !== "ADMIN") {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 p-4 transition-colors">
        <AdminLoginForm />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar user={user} />
      <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8">
        {children}
      </div>
    </div>
  );
}
