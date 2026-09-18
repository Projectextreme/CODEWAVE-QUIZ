import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveActiveQuiz } from "@/lib/services/quiz.service";
import { Navbar } from "@/components/layout/Navbar";
import {
  Clock,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  ArrowRight,
  FileCheck2,
} from "lucide-react";
import { StartAssessmentButton } from "@/components/quiz/StartAssessmentButton";

export default async function HomePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  if (user.role === "ADMIN") {
    redirect("/admin");
  }

  const activeQuiz = await resolveActiveQuiz();

  // Fetch user's attempt for the active quiz
  const activeQuizAttempt = activeQuiz
    ? await prisma.attempt.findUnique({
        where: {
          quizId_userId: {
            quizId: activeQuiz.id,
            userId: user.userId,
          },
        },
      })
    : null;

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#070d1e] text-slate-900 dark:text-slate-100 transition-colors">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white">
              Hello, {user.name} 👋
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {user.teamId ? (
                <span>Team Member • Ready for assessment</span>
              ) : (
                <span>Independent Participant</span>
              )}
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-600 dark:text-cyan-400 text-xs font-bold flex items-center space-x-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Active Assessment Portal</span>
            </div>
          </div>
        </div>

        {/* Available Quiz Card */}
        {activeQuiz ? (
          <div className="glass-panel rounded-3xl p-6 sm:p-8 border border-cyan-500/30 shadow-2xl relative overflow-hidden space-y-6">
            <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Live Available Assessment
                </span>
              </div>

              <div className="flex items-center space-x-3 text-xs text-slate-500 dark:text-slate-400">
                <span className="flex items-center space-x-1">
                  <Clock className="w-4 h-4 text-cyan-500" />
                  <span>{activeQuiz.durationMinutes || 45} mins</span>
                </span>
                <span>•</span>
                <span>
                  {activeQuiz.sections.reduce((a, s) => a + s.questions.length, 0)} Questions
                </span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                {activeQuiz.title}
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                {activeQuiz.description}
              </p>
            </div>

            {/* Sections summary tags */}
            <div className="flex flex-wrap gap-2 pt-1">
              {activeQuiz.sections.map((sec, idx) => (
                <div
                  key={sec.id}
                  className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 text-xs text-slate-700 dark:text-slate-300 font-medium"
                >
                  <span className="text-cyan-500 font-bold mr-1">#{idx + 1}</span>
                  {sec.title} ({sec.questions.length} Qs)
                </div>
              ))}
            </div>

            {/* User Attempt Status / Action */}
            <div className="pt-6 border-t border-slate-200 dark:border-slate-800/80 flex flex-wrap items-center justify-between gap-4">
              {activeQuizAttempt?.status === "SUBMITTED" ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      Assessment Submitted
                    </div>
                    <div className="text-xs text-slate-500">
                      Your responses have been recorded successfully
                    </div>
                  </div>
                </div>
              ) : activeQuizAttempt?.status === "IN_PROGRESS" ? (
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Clock className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-amber-600 dark:text-amber-400">
                      Attempt In Progress
                    </div>
                    <div className="text-xs text-slate-500">
                      You have an active session running
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Ready to begin? The timer will start upon entering.
                </div>
              )}

              {activeQuizAttempt?.status === "SUBMITTED" ? (
                <Link
                  href={`/quiz/${activeQuiz.id}/result/${activeQuizAttempt.id}`}
                  className="px-6 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white text-sm font-bold shadow-md transition-all flex items-center space-x-2"
                >
                  <FileCheck2 className="w-4 h-4 text-emerald-400" />
                  <span>View Submission Receipt</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              ) : (
                <StartAssessmentButton
                  quizId={activeQuiz.id}
                  hasPasscode={Boolean(activeQuiz.passcode && activeQuiz.passcode.trim() !== "")}
                  hasInProgressAttempt={activeQuizAttempt?.status === "IN_PROGRESS"}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="p-12 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-center space-y-3 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              No Quiz Currently Active
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-md mx-auto">
              Administrators will schedule or activate the next assessment soon. Check back shortly.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
