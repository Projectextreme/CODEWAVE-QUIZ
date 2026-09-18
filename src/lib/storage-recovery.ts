/**
 * Storage recovery utilities for Semaphore Assessment Platform.
 * Saves user answer snapshots in browser localStorage for offline resilience & emergency scoring.
 */

export interface SavedQuestionDetail {
  id: string;
  text: string;
  sectionTitle: string;
  options: Array<{ id: string; text: string }>;
}

export interface SavedAnswerDetail {
  questionId: string;
  questionText?: string;
  selectedOptionId: string | null;
  selectedOptionText?: string;
  isMarkedForReview: boolean;
  updatedAt: string;
}

export interface QuizLocalStorageBackup {
  quizId: string;
  quizTitle: string;
  attemptId: string | null;
  status: "IN_PROGRESS" | "SUBMITTED";
  startedAt: string;
  lastSavedAt: string;
  submittedAt: string | null;
  totalQuestions: number;
  answeredCount: number;
  answers: Record<string, SavedAnswerDetail>;
  questionsSummary: SavedQuestionDetail[];
}

const STORAGE_PREFIX = "semaphore_quiz_backup_";
const QUIZ_INDEX_KEY = "semaphore_saved_quiz_ids";

/**
 * Save or update a quiz session in localStorage
 */
export function saveQuizToLocalStorage(backup: QuizLocalStorageBackup) {
  if (typeof window === "undefined") return;

  try {
    const key = `${STORAGE_PREFIX}${backup.quizId}`;
    localStorage.setItem(key, JSON.stringify(backup));

    // Update index list
    const indexRaw = localStorage.getItem(QUIZ_INDEX_KEY);
    let index: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!index.includes(backup.quizId)) {
      index.push(backup.quizId);
      localStorage.setItem(QUIZ_INDEX_KEY, JSON.stringify(index));
    }
  } catch (err) {
    console.warn("Failed to persist backup to localStorage:", err);
  }
}

/**
 * Retrieve a specific quiz backup
 */
export function getQuizFromLocalStorage(quizId: string): QuizLocalStorageBackup | null {
  if (typeof window === "undefined") return null;

  try {
    const key = `${STORAGE_PREFIX}${quizId}`;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    console.warn(`Failed to read backup for quiz ${quizId}:`, err);
    return null;
  }
}

/**
 * Retrieve all quiz backups from localStorage
 */
export function getAllQuizBackupsFromLocalStorage(): QuizLocalStorageBackup[] {
  if (typeof window === "undefined") return [];

  try {
    const results: QuizLocalStorageBackup[] = [];
    const seen = new Set<string>();

    // 1. Check indexed quiz IDs
    const indexRaw = localStorage.getItem(QUIZ_INDEX_KEY);
    if (indexRaw) {
      try {
        const ids: string[] = JSON.parse(indexRaw);
        ids.forEach((id) => {
          const item = getQuizFromLocalStorage(id);
          if (item && !seen.has(item.quizId)) {
            seen.add(item.quizId);
            results.push(item);
          }
        });
      } catch {}
    }

    // 2. Scan all localStorage keys for any unindexed matching prefixes
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        const quizId = k.replace(STORAGE_PREFIX, "");
        if (!seen.has(quizId)) {
          try {
            const val = localStorage.getItem(k);
            if (val) {
              const parsed = JSON.parse(val);
              seen.add(quizId);
              results.push(parsed);
            }
          } catch {}
        }
      }
    }

    return results.sort(
      (a, b) => new Date(b.lastSavedAt).getTime() - new Date(a.lastSavedAt).getTime()
    );
  } catch (err) {
    console.warn("Failed to fetch all backups:", err);
    return [];
  }
}
