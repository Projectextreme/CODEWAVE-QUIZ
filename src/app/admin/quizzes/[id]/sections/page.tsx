"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { CodeViewer } from "@/components/quiz/CodeViewer";
import {
  ArrowLeft,
  Plus,
  Edit3,
  Trash2,
  Layers,
  Code,
  Image as ImageIcon,
  CheckCircle2,
  Eye,
  AlertCircle,
  Loader2,
  X,
  FileText,
  Upload,
  FolderOpen,
  Link as LinkIcon,
} from "lucide-react";

interface OptionItem {
  id?: string;
  text: string;
  isCorrect: boolean;
  orderIndex: number;
}

interface QuestionItem {
  id: string;
  sectionId: string;
  type: "THEORY" | "CODE" | "IMAGE";
  text: string;
  codeSnippet?: string | null;
  codeLanguage?: string | null;
  imageUrl?: string | null;
  marks: number;
  orderIndex: number;
  options: OptionItem[];
}

interface SectionItem {
  id: string;
  quizId: string;
  title: string;
  description?: string | null;
  orderIndex: number;
  defaultMarks: number;
  questions: QuestionItem[];
}

export default function QuizSectionsAndQuestionsPage() {
  const params = useParams();
  const quizId = params.id as string;

  const [sections, setSections] = useState<SectionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");
  const [sectionDesc, setSectionDesc] = useState("");
  const [sectionMarks, setSectionMarks] = useState("1.0");

  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [targetSectionId, setTargetSectionId] = useState("");
  const [qType, setQType] = useState<"THEORY" | "CODE" | "IMAGE">("THEORY");
  const [qText, setQText] = useState("");
  const [qMarks, setQMarks] = useState("1.0");
  const [qCodeSnippet, setQCodeSnippet] = useState("");
  const [qCodeLanguage, setQCodeLanguage] = useState("javascript");
  const [qImageUrl, setQImageUrl] = useState("");
  const [qOptions, setQOptions] = useState<OptionItem[]>([
    { text: "", isCorrect: true, orderIndex: 0 },
    { text: "", isCorrect: false, orderIndex: 1 },
    { text: "", isCorrect: false, orderIndex: 2 },
    { text: "", isCorrect: false, orderIndex: 3 },
  ]);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Image upload state
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File) => {
    setUploadingImage(true);
    setUploadError(null);
    // Show instant local preview using browser blob URL
    const blobUrl = URL.createObjectURL(file);
    setLocalPreviewUrl(blobUrl);
    // Set a temporary placeholder so preview panel shows immediately
    setQImageUrl("__uploading__");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed.");
      // Replace placeholder with real server URL
      setQImageUrl(data.url);
    } catch (err: any) {
      setUploadError(err.message || "Image upload failed.");
      // Keep showing local preview even if upload failed
      setQImageUrl("");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageUpload(file);
      // Reset input so same file can be re-selected
      e.target.value = "";
    }
  };

  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleImageUpload(file);
  };

  const clearImage = () => {
    setQImageUrl("");
    setLocalPreviewUrl(null);
    setUploadError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const fetchSections = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/quizzes/${quizId}/sections`);
      const data = await res.json();
      if (res.ok) {
        setSections(data.sections);
        if (data.sections.length > 0 && !targetSectionId) {
          setTargetSectionId(data.sections[0].id);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load sections.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (quizId) fetchSections();
  }, [quizId]);

  // Section Creation
  const handleCreateSection = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/admin/quizzes/${quizId}/sections`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: sectionTitle,
          description: sectionDesc,
          defaultMarks: Number(sectionMarks) || 1.0,
        }),
      });
      if (res.ok) {
        setIsSectionModalOpen(false);
        setSectionTitle("");
        setSectionDesc("");
        await fetchSections();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Section
  const handleDeleteSection = async (sectionId: string, title: string) => {
    if (!confirm(`Delete section "${title}" and all its questions?`)) return;
    try {
      await fetch(`/api/admin/sections/${sectionId}`, { method: "DELETE" });
      await fetchSections();
    } catch (err) {
      console.error(err);
    }
  };

  // Open Create Question Modal
  const handleOpenAddQuestion = (secId: string, defaultMark: number = 1.0) => {
    setEditingQuestionId(null);
    setTargetSectionId(secId);
    setQType("THEORY");
    setQText("");
    setQMarks(String(defaultMark));
    setQCodeSnippet("");
    setQCodeLanguage("javascript");
    setQImageUrl("");
    setUploadError(null);
    setShowUrlInput(false);
    setLocalPreviewUrl(null);
    setQOptions([
      { text: "", isCorrect: true, orderIndex: 0 },
      { text: "", isCorrect: false, orderIndex: 1 },
      { text: "", isCorrect: false, orderIndex: 2 },
      { text: "", isCorrect: false, orderIndex: 3 },
    ]);
    setIsQuestionModalOpen(true);
  };

  // Open Edit Question Modal
  const handleOpenEditQuestion = (question: QuestionItem) => {
    setEditingQuestionId(question.id);
    setTargetSectionId(question.sectionId);
    setQType(question.type);
    setQText(question.text);
    setQMarks(String(question.marks));
    setQCodeSnippet(question.codeSnippet || "");
    setQCodeLanguage(question.codeLanguage || "javascript");
    setQImageUrl(question.imageUrl || "");
    setLocalPreviewUrl(question.imageUrl || null);
    setUploadError(null);
    setShowUrlInput(false);
    setQOptions(
      question.options.map((opt, i) => ({
        text: opt.text,
        isCorrect: opt.isCorrect,
        orderIndex: i,
      }))
    );
    setIsQuestionModalOpen(true);
  };

  // Save Question
  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate options
    if (qOptions.some((o) => !o.text.trim())) {
      alert("All 4 options must contain text.");
      return;
    }

    const correctCount = qOptions.filter((o) => o.isCorrect).length;
    if (correctCount !== 1) {
      alert("Please designate exactly one correct option.");
      return;
    }

    setSavingQuestion(true);
    try {
      const payload = {
        sectionId: targetSectionId,
        type: qType,
        text: qText,
        marks: Number(qMarks) || 1.0,
        codeSnippet: qType === "CODE" ? qCodeSnippet : null,
        codeLanguage: qType === "CODE" ? qCodeLanguage : null,
        imageUrl: qType === "IMAGE" ? qImageUrl : null,
        options: qOptions,
      };

      let res;
      if (editingQuestionId) {
        res = await fetch(`/api/admin/questions/${editingQuestionId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        res = await fetch(`/api/admin/questions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        setIsQuestionModalOpen(false);
        await fetchSections();
      } else {
        const d = await res.json();
        alert(d.error || "Failed to save question.");
      }
    } catch (err: any) {
      alert(err.message || "An error occurred.");
    } finally {
      setSavingQuestion(false);
    }
  };

  // Delete Question
  const handleDeleteQuestion = async (qId: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    try {
      await fetch(`/api/admin/questions/${qId}`, { method: "DELETE" });
      await fetchSections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleSetCorrectOption = (index: number) => {
    setQOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        isCorrect: i === index,
      }))
    );
  };

  const handleOptionTextChange = (index: number, val: string) => {
    setQOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, text: val } : opt))
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <Link
          href="/admin/quizzes"
          className="flex items-center space-x-2 text-xs sm:text-sm font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>

        <div className="flex items-center space-x-3">
          <Link
            href={`/admin/quizzes/${quizId}/preview`}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs sm:text-sm font-bold shadow-md transition-all flex items-center space-x-1.5"
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Preview Quiz</span>
          </Link>

          <button
            onClick={() => setIsSectionModalOpen(true)}
            type="button"
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs sm:text-sm font-bold shadow-md shadow-cyan-600/20 transition-all flex items-center space-x-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Add Section</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-3 text-cyan-400">
          <Loader2 className="w-8 h-8 animate-spin" />
          <p className="text-xs text-slate-400">Loading quiz sections...</p>
        </div>
      ) : sections.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 space-y-3">
          <Layers className="w-8 h-8 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            No Sections Created Yet
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Quizzes require at least one section before questions can be configured.
          </p>
          <button
            onClick={() => setIsSectionModalOpen(true)}
            className="px-5 py-2.5 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md"
          >
            Create First Section
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {sections.map((section, sIdx) => (
            <div
              key={section.id}
              className="bg-white dark:bg-slate-900/80 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-6 bg-slate-50/80 dark:bg-slate-950/60 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20">
                      Section {sIdx + 1}
                    </span>
                    <span className="text-xs text-slate-400 font-semibold">
                      • {section.questions.length} Questions (
                      {section.questions.reduce((a, q) => a + q.marks, 0)} Marks)
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {section.title}
                  </h3>
                  {section.description && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {section.description}
                    </p>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() =>
                      handleOpenAddQuestion(section.id, section.defaultMarks)
                    }
                    type="button"
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-sm transition-all flex items-center space-x-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Question</span>
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteSection(section.id, section.title)
                    }
                    type="button"
                    className="p-2 rounded-xl text-rose-500 hover:bg-rose-500/10 transition-colors"
                    title="Delete Section"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Questions in this Section */}
              <div className="p-6 space-y-4">
                {section.questions.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50/50 dark:bg-slate-800/30 border border-dashed border-slate-300 dark:border-slate-700 text-xs text-slate-400 space-y-2">
                    <FileText className="w-6 h-6 text-slate-400 mx-auto" />
                    <p>No questions added to this section yet.</p>
                    <button
                      onClick={() =>
                        handleOpenAddQuestion(section.id, section.defaultMarks)
                      }
                      className="text-cyan-600 dark:text-cyan-400 font-bold hover:underline"
                    >
                      + Add Question
                    </button>
                  </div>
                ) : (
                  section.questions.map((q, qIdx) => (
                    <div
                      key={q.id}
                      className="p-5 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-800/80 shadow-sm space-y-3"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                              Q{qIdx + 1}.
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 uppercase">
                              {q.type}
                            </span>
                            <span className="text-xs font-semibold text-cyan-600 dark:text-cyan-400">
                              {q.marks} {q.marks === 1 ? "Mark" : "Marks"}
                            </span>
                          </div>

                          <h4 className="text-sm font-semibold text-slate-900 dark:text-white leading-relaxed">
                            {q.text}
                          </h4>
                        </div>

                        <div className="flex items-center space-x-1 shrink-0">
                          <button
                            onClick={() => handleOpenEditQuestion(q)}
                            type="button"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-cyan-500 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                            title="Edit Question"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteQuestion(q.id)}
                            type="button"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
                            title="Delete Question"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {q.type === "CODE" && q.codeSnippet && (
                        <CodeViewer
                          code={q.codeSnippet}
                          language={q.codeLanguage || "javascript"}
                        />
                      )}

                      {q.type === "IMAGE" && q.imageUrl && (
                        <div className="my-2 rounded-xl overflow-hidden max-h-48 border border-slate-200 dark:border-slate-800 flex items-center justify-center bg-slate-950/40">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={q.imageUrl}
                            alt="Question preview"
                            className="max-h-48 w-auto object-contain rounded"
                          />
                        </div>
                      )}

                      {/* Options breakdown */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-xs">
                        {q.options.map((opt, oIdx) => (
                          <div
                            key={opt.id || oIdx}
                            className={`p-2.5 rounded-xl border flex items-center justify-between ${
                              opt.isCorrect
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300 font-bold"
                                : "bg-white dark:bg-slate-900/60 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                            }`}
                          >
                            <span>
                              <span className="font-bold mr-1.5">
                                {String.fromCharCode(65 + oIdx)}.
                              </span>
                              {opt.text}
                            </span>
                            {opt.isCorrect && (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 ml-2" />
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 1. Modal: Create Section */}
      {isSectionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Add Section
              </h3>
              <button
                onClick={() => setIsSectionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Section Title *
                </label>
                <input
                  type="text"
                  required
                  value={sectionTitle}
                  onChange={(e) => setSectionTitle(e.target.value)}
                  placeholder="e.g. Section 1: Architecture & Theory"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Description (Optional)
                </label>
                <textarea
                  rows={2}
                  value={sectionDesc}
                  onChange={(e) => setSectionDesc(e.target.value)}
                  placeholder="Brief note on topic focus..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Default Marks Per Question
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  value={sectionMarks}
                  onChange={(e) => setSectionMarks(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsSectionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md hover:bg-cyan-500 transition-all"
                >
                  Create Section
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Modal: Add / Edit Question */}
      {isQuestionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-2xl my-8 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {editingQuestionId ? "Edit Question" : "Create New Question"}
              </h3>
              <button
                onClick={() => setIsQuestionModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Section *
                  </label>
                  <select
                    value={targetSectionId}
                    onChange={(e) => setTargetSectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    {sections.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Type *
                  </label>
                  <select
                    value={qType}
                    onChange={(e) =>
                      setQType(e.target.value as "THEORY" | "CODE" | "IMAGE")
                    }
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  >
                    <option value="THEORY">Theory (Text only)</option>
                    <option value="CODE">Code Snippet</option>
                    <option value="IMAGE">Image / Diagram</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                    Marks *
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={qMarks}
                    onChange={(e) => setQMarks(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Question Text *
                </label>
                <textarea
                  rows={3}
                  required
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  placeholder="Enter the question prompt..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                />
              </div>

              {/* Code snippet inputs if CODE type */}
              {qType === "CODE" && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-cyan-400 flex items-center space-x-1">
                      <Code className="w-3.5 h-3.5" />
                      <span>Code Snippet</span>
                    </label>
                    <select
                      value={qCodeLanguage}
                      onChange={(e) => setQCodeLanguage(e.target.value)}
                      className="px-2.5 py-1 rounded-lg border border-slate-700 bg-slate-900 text-cyan-300 text-xs font-mono"
                    >
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="python">Python</option>
                      <option value="pseudocode">Pseudocode</option>
                      <option value="sql">SQL / Postgres</option>
                      <option value="java">Java</option>
                      <option value="cpp">C++</option>
                      <option value="go">Go</option>
                      <option value="c">C</option>
                    </select>
                  </div>
                  <textarea
                    rows={5}
                    value={qCodeSnippet}
                    onChange={(e) => setQCodeSnippet(e.target.value)}
                    placeholder="Paste code snippet here..."
                    className="w-full p-3 rounded-xl border border-slate-800 bg-slate-900 text-cyan-100 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                  />
                </div>
              )}

              {/* Image Upload if IMAGE type */}
              {qType === "IMAGE" && (
                <div className="space-y-3 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center space-x-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-cyan-500" />
                      <span>Question Image</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowUrlInput((v) => !v)}
                      className="flex items-center space-x-1 text-[11px] font-semibold text-slate-500 hover:text-cyan-500 transition-colors"
                    >
                      <LinkIcon className="w-3 h-3" />
                      <span>{showUrlInput ? "Hide URL" : "Paste URL instead"}</span>
                    </button>
                  </div>

                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleFileInputChange}
                  />

                  {/* Drop zone — hide once image is selected or uploaded */}
                  {!localPreviewUrl && !qImageUrl && (
                    <div
                      onDrop={handleImageDrop}
                      onDragOver={(e) => e.preventDefault()}
                      className="relative border-2 border-dashed border-slate-300 dark:border-slate-600 hover:border-cyan-500 dark:hover:border-cyan-500 rounded-2xl p-8 text-center cursor-pointer transition-colors group"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {uploadingImage ? (
                        <div className="flex flex-col items-center space-y-2 text-cyan-500">
                          <Loader2 className="w-8 h-8 animate-spin" />
                          <span className="text-xs font-semibold">Uploading...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center space-y-2 text-slate-400 group-hover:text-cyan-500 transition-colors">
                          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center group-hover:bg-cyan-500/10">
                            <Upload className="w-5 h-5" />
                          </div>
                          <div className="space-y-0.5">
                            <p className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-cyan-600 dark:group-hover:text-cyan-400">
                              Drop image here or{" "}
                              <span className="text-cyan-600 dark:text-cyan-400 underline underline-offset-2">
                                browse
                              </span>
                            </p>
                            <p className="text-[11px] text-slate-400">PNG, JPG, GIF, WebP, SVG — max 5 MB</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Preview — shown immediately from local blob or from server URL */}
                  {(localPreviewUrl || (qImageUrl && qImageUrl !== "__uploading__")) && (
                    <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-slate-950/30">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={localPreviewUrl || qImageUrl}
                        alt="Uploaded preview"
                        className="w-full max-h-52 object-contain bg-slate-100 dark:bg-slate-900"
                      />
                      {/* Upload progress overlay */}
                      {uploadingImage && (
                        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex flex-col items-center justify-center space-y-2">
                          <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                          <span className="text-xs font-semibold text-white">Uploading to server...</span>
                        </div>
                      )}
                      {/* Uploaded badge */}
                      {!uploadingImage && qImageUrl && qImageUrl !== "__uploading__" && (
                        <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-600/90 text-white text-[10px] font-bold backdrop-blur-sm">
                          ✓ Saved
                        </div>
                      )}
                      <div className="absolute top-2 right-2 flex space-x-1.5">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploadingImage}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-cyan-600 disabled:opacity-50 text-white text-[11px] font-bold flex items-center space-x-1 backdrop-blur-sm transition-colors"
                        >
                          <FolderOpen className="w-3 h-3" />
                          <span>Change</span>
                        </button>
                        <button
                          type="button"
                          onClick={clearImage}
                          disabled={uploadingImage}
                          className="p-1.5 rounded-lg bg-rose-600/80 hover:bg-rose-600 disabled:opacity-50 text-white backdrop-blur-sm transition-colors"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                      {/* Show URL only after confirmed upload */}
                      {!uploadingImage && qImageUrl && qImageUrl !== "__uploading__" && (
                        <div className="p-2 text-[10px] text-slate-400 font-mono truncate bg-slate-950/60">
                          {qImageUrl}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Upload error */}
                  {uploadError && (
                    <div className="flex items-center space-x-2 text-rose-500 text-xs p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  {/* Optional: manual URL input toggle */}
                  {showUrlInput && (
                    <div className="space-y-1.5">
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Or paste external URL
                      </label>
                      <input
                        type="url"
                        value={qImageUrl}
                        onChange={(e) => setQImageUrl(e.target.value)}
                        placeholder="https://example.com/image.png"
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* 4 Options Configuration with Correct Option Selection */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                    Four Options (Select Correct Answer Radio) *
                  </label>
                  <span className="text-[11px] text-cyan-600 dark:text-cyan-400 font-bold">
                    Exactly 1 correct choice
                  </span>
                </div>

                <div className="space-y-2.5">
                  {qOptions.map((opt, idx) => (
                    <div
                      key={idx}
                      className={`flex items-center space-x-3 p-3 rounded-xl border transition-all ${
                        opt.isCorrect
                          ? "border-emerald-500/50 bg-emerald-500/5 dark:bg-emerald-950/20"
                          : "border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
                      }`}
                    >
                      <input
                        type="radio"
                        name="correctOptionRadio"
                        checked={opt.isCorrect}
                        onChange={() => handleSetCorrectOption(idx)}
                        className="w-4 h-4 text-emerald-600 cursor-pointer"
                        title="Mark as correct option"
                      />
                      <span className="text-xs font-bold text-slate-500 w-4">
                        {String.fromCharCode(65 + idx)}.
                      </span>
                      <input
                        type="text"
                        required
                        value={opt.text}
                        onChange={(e) =>
                          handleOptionTextChange(idx, e.target.value)
                        }
                        placeholder={`Option ${String.fromCharCode(65 + idx)} text`}
                        className="flex-1 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
                      />
                      {opt.isCorrect && (
                        <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded bg-emerald-500/10">
                          Correct
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsQuestionModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-6 py-2 rounded-xl bg-cyan-600 text-white text-xs font-bold shadow-md hover:bg-cyan-500 transition-all disabled:opacity-50"
                >
                  {savingQuestion ? "Saving..." : "Save Question"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
