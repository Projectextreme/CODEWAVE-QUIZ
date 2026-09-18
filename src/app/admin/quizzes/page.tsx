"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  BookOpen,
  Plus,
  Play,
  Pause,
  Copy,
  Edit3,
  Trash2,
  Eye,
  BarChart2,
  Upload,
  Download,
  Layers,
  Loader2,
  Key,
  X,
  AlertCircle,
  FileJson,
  Check,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

interface QuizItem {
  id: string;
  title: string;
  description: string;
  passcode?: string | null;
  durationMinutes: number;
  startTime: string | null;
  endTime: string | null;
  status: string;
  isManualActive: boolean;
  totalSections: number;
  totalQuestions: number;
  totalMarks: number;
  totalAttempts: number;
  completedAttempts: number;
  createdAt: string;
}

const SAMPLE_QUIZ_JSON = {
  title: "Engineering Assessment Sample (JSON Import)",
  description: "Assessment imported via JSON with multiple sections, code snippets, and custom marks.",
  passcode: "QUIZ2026",
  durationMinutes: 30,
  status: "DRAFT",
  sections: [
    {
      title: "Section 1: Core Fundamentals",
      description: "Fundamental concepts (1 mark each)",
      defaultMarks: 1.0,
      questions: [
        {
          type: "THEORY",
          text: "Which protocol is utilized by HTTP/3 at the transport layer?",
          marks: 1.0,
          options: [
            { text: "QUIC over UDP", isCorrect: true },
            { text: "TCP with TLS 1.3", isCorrect: false },
            { text: "SCTP", isCorrect: false },
            { text: "WebSockets", isCorrect: false }
          ]
        }
      ]
    },
    {
      title: "Section 2: Code Evaluation",
      description: "Output prediction (2 marks each)",
      defaultMarks: 2.0,
      questions: [
        {
          type: "CODE",
          text: "What does this TypeScript snippet evaluate to?",
          codeLanguage: "typescript",
          codeSnippet: "type IsString<T> = T extends string ? true : false;\ntype Res = IsString<'hello'>;",
          marks: 2.0,
          options: [
            { text: "true", isCorrect: true },
            { text: "false", isCorrect: false },
            { text: "string", isCorrect: false },
            { text: "boolean", isCorrect: false }
          ]
        }
      ]
    }
  ]
};

export default function AdminQuizzesPage() {
  const [quizzes, setQuizzes] = useState<QuizItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [copiedPasscodeId, setCopiedPasscodeId] = useState<string | null>(null);

  const handleCopyPasscode = (quizId: string, passcodeText: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(passcodeText);
    setCopiedPasscodeId(quizId);
    setTimeout(() => setCopiedPasscodeId(null), 2000);
  };
  // JSON Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [jsonContent, setJsonContent] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/admin/quizzes");
      const data = await res.json();
      if (res.ok) {
        setQuizzes(data.quizzes);
      }
    } catch (err) {
      console.error("Fetch quizzes error", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuizzes();
  }, []);

  const handleToggleActive = async (quizId: string, currentActive: boolean) => {
    setActionLoading(quizId);
    try {
      await fetch(`/api/admin/quizzes/${quizId}/activate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: currentActive ? "deactivate" : "activate",
        }),
      });
      await fetchQuizzes();
    } catch (err) {
      console.error("Toggle active error", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDuplicate = async (quizId: string) => {
    setActionLoading(quizId);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/duplicate`, {
        method: "POST",
      });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error("Duplicate error", err);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (quizId: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;

    setActionLoading(quizId);
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        await fetchQuizzes();
      }
    } catch (err) {
      console.error("Delete error", err);
    } finally {
      setActionLoading(null);
    }
  };

  // Handle File Upload for JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setJsonContent(content);
    };
    reader.readAsText(file);
  };

  // Handle JSON Import Submit
  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportError(null);

    let parsed;
    try {
      parsed = JSON.parse(jsonContent);
    } catch {
      setImportError("Invalid JSON format. Please ensure valid syntax.");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/admin/quizzes/import-json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(parsed),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to import quiz.");
      }

      setIsImportModalOpen(false);
      setJsonContent("");
      await fetchQuizzes();
    } catch (err: any) {
      setImportError(err.message || "Failed to import quiz.");
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadTemplate = () => {
    const dataStr =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(SAMPLE_QUIZ_JSON, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "quiz_template.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Quiz Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Create, schedule, upload JSON, and manage all quiz questions & sections.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              setJsonContent(JSON.stringify(SAMPLE_QUIZ_JSON, null, 2));
              setIsImportModalOpen(true);
            }}
            type="button"
            className="px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold transition-all flex items-center space-x-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-cyan-600" />
            <span>Upload JSON</span>
          </button>

          <Link
            href="/admin/quizzes/new"
            className="px-3.5 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span>New Quiz</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-2 text-cyan-600">
          <Loader2 className="w-7 h-7 animate-spin" />
          <p className="text-xs text-slate-400">Loading quizzes...</p>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="p-12 text-center rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
          <BookOpen className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            No Quizzes Found
          </h3>
          <p className="text-xs text-slate-500">
            Create a quiz manually or upload a JSON template.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {quizzes.map((quiz) => {
            const isActive = quiz.isManualActive || quiz.status === "ACTIVE";

            return (
              <div
                key={quiz.id}
                className={`p-4 sm:p-5 rounded-xl bg-white dark:bg-slate-900 border transition-all ${
                  isActive
                    ? "border-cyan-500 ring-1 ring-cyan-500/20 shadow-sm"
                    : "border-slate-200 dark:border-slate-800"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-4">
                  {/* Left: Info */}
                  <div className="space-y-1.5 flex-1 min-w-[280px]">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                          isActive
                            ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400"
                            : quiz.status === "SCHEDULED"
                            ? "bg-sky-100 dark:bg-sky-950/40 text-sky-700 dark:text-sky-400"
                            : quiz.status === "COMPLETED"
                            ? "bg-slate-100 dark:bg-slate-800 text-slate-500"
                            : "bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400"
                        }`}
                      >
                        {isActive ? "ACTIVE NOW" : quiz.status}
                      </span>

                      {quiz.passcode && (
                        <button
                          type="button"
                          onClick={(e) => handleCopyPasscode(quiz.id, quiz.passcode!, e)}
                          title="Click to copy passcode"
                          className="flex items-center space-x-1.5 px-2.5 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 transition-colors cursor-pointer group"
                        >
                          <Key className="w-3 h-3 text-amber-500" />
                          <span>Passcode: {quiz.passcode}</span>
                          {copiedPasscodeId === quiz.id ? (
                            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 flex items-center gap-0.5 font-sans">
                              <Check className="w-3 h-3" /> Copied!
                            </span>
                          ) : (
                            <Copy className="w-2.5 h-2.5 opacity-60 group-hover:opacity-100 transition-opacity" />
                          )}
                        </button>
                      )}

                      <span className="text-xs text-slate-400">
                        {quiz.durationMinutes || 30} mins
                      </span>

                      <span className="text-xs text-slate-400">
                        • {quiz.totalSections} Sections • {quiz.totalQuestions} Qs (
                        {quiz.totalMarks} pts)
                      </span>
                    </div>

                    <h2 className="text-base font-bold text-slate-900 dark:text-white">
                      {quiz.title}
                    </h2>

                    {quiz.description && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        {quiz.description}
                      </p>
                    )}
                  </div>

                  {/* Right: Action Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {/* Active toggle */}
                    <button
                      onClick={() => handleToggleActive(quiz.id, isActive)}
                      disabled={actionLoading === quiz.id}
                      type="button"
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1 ${
                        isActive
                          ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 hover:bg-amber-200"
                          : "bg-cyan-600 hover:bg-cyan-500 text-white shadow-sm"
                      }`}
                    >
                      {isActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Deactivate</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-white" />
                          <span>Activate</span>
                        </>
                      )}
                    </button>

                    {/* Questions & Sections Manager */}
                    <Link
                      href={`/admin/quizzes/${quiz.id}/sections`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold flex items-center space-x-1"
                    >
                      <Layers className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Questions ({quiz.totalQuestions})</span>
                    </Link>

                    {/* Preview */}
                    <Link
                      href={`/admin/quizzes/${quiz.id}/preview`}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Preview Quiz"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>

                    {/* Leaderboard for this Quiz */}
                    <Link
                      href={`/admin/leaderboard?quizId=${quiz.id}`}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Quiz Leaderboard"
                    >
                      <BarChart2 className="w-4 h-4" />
                    </Link>

                    {/* Duplicate */}
                    <button
                      onClick={() => handleDuplicate(quiz.id)}
                      disabled={actionLoading === quiz.id}
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Edit */}
                    <Link
                      href={`/admin/quizzes/${quiz.id}/edit`}
                      className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>

                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(quiz.id, quiz.title)}
                      disabled={actionLoading === quiz.id}
                      type="button"
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* JSON Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center space-x-2">
                <FileJson className="w-5 h-5 text-cyan-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Import Quiz from JSON
                </h3>
              </div>
              <button
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 rounded text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="flex items-center space-x-2">
                <label className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold cursor-pointer hover:bg-slate-200">
                  <span>Browse .JSON file</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-cyan-600 dark:text-cyan-400 font-semibold hover:underline flex items-center space-x-1"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Sample Template</span>
              </button>
            </div>

            {importError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-600 dark:text-rose-400 text-xs flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{importError}</span>
              </div>
            )}

            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  JSON Quiz Structure (paste or upload file)
                </label>
                <textarea
                  rows={14}
                  required
                  value={jsonContent}
                  onChange={(e) => setJsonContent(e.target.value)}
                  className="w-full p-3 rounded-lg border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={importing || !jsonContent.trim()}
                  className="px-5 py-2 rounded-lg bg-cyan-600 text-white text-xs font-bold hover:bg-cyan-500 transition-all disabled:opacity-50"
                >
                  {importing ? "Importing..." : "Create Quiz from JSON"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
