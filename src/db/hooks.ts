import { useLiveQuery } from "dexie-react-hooks";
import { db } from "./database";
import type {
  StudySession,
  JournalEntry,
  Note,
  Project,
  HealthLog,
  HabitRecord,
  GuitarProgress,
  GuitarLevel,
  GuitarLog,
} from "./database";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns today's date as YYYY-MM-DD. */
function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/** Returns the Monday of the current ISO week as YYYY-MM-DD. */
function mondayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay(); // 0 = Sun, 1 = Mon …
  const diff = day === 0 ? 6 : day - 1; // days since Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - diff);
  return monday.toISOString().slice(0, 10);
}

/** Returns the Sunday of the current ISO week as YYYY-MM-DD. */
function sundayOfCurrentWeek(): string {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? 0 : 7 - day;
  const sunday = new Date(now);
  sunday.setDate(now.getDate() + diff);
  return sunday.toISOString().slice(0, 10);
}

// ---------------------------------------------------------------------------
// Study Session hooks
// ---------------------------------------------------------------------------

export function useStudySessions(limit?: number) {
  return useLiveQuery(() =>
    limit
      ? db.studySessions.orderBy("date").reverse().limit(limit).toArray()
      : db.studySessions.orderBy("date").reverse().toArray(),
  );
}

export function useStudySessionsByDate(date: string) {
  return useLiveQuery(
    () => db.studySessions.where("date").equals(date).toArray(),
    [date],
  );
}

export function useWeeklyStudyHours() {
  return useLiveQuery(async () => {
    const mon = mondayOfCurrentWeek();
    const sun = sundayOfCurrentWeek();
    const sessions = await db.studySessions
      .where("date")
      .between(mon, sun, true, true)
      .toArray();
    const totalMinutes = sessions.reduce((sum, s) => sum + s.timeSpent, 0);
    return +(totalMinutes / 60).toFixed(1);
  });
}

// ---------------------------------------------------------------------------
// Journal hooks
// ---------------------------------------------------------------------------

export function useJournalEntries(limit?: number) {
  return useLiveQuery(() =>
    limit
      ? db.journalEntries.orderBy("date").reverse().limit(limit).toArray()
      : db.journalEntries.orderBy("date").reverse().toArray(),
  );
}

export function useJournalEntry(date: string) {
  return useLiveQuery(
    () => db.journalEntries.where("date").equals(date).first(),
    [date],
  );
}

// ---------------------------------------------------------------------------
// Notes hooks
// ---------------------------------------------------------------------------

export function useNotes(category?: string) {
  return useLiveQuery(
    () =>
      category
        ? db.notes.where("category").equals(category).toArray()
        : db.notes.toArray(),
    [category],
  );
}

export function useNote(id: number) {
  return useLiveQuery(() => db.notes.get(id), [id]);
}

export function useNoteCategories() {
  return useLiveQuery(() => db.notes.orderBy("category").uniqueKeys());
}

export function useRecentNotes(limit?: number) {
  return useLiveQuery(async () => {
    const all = await db.notes.toArray();
    all.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
    return limit ? all.slice(0, limit) : all;
  });
}

// ---------------------------------------------------------------------------
// Projects hooks
// ---------------------------------------------------------------------------

export function useProjects(status?: string) {
  return useLiveQuery(
    () =>
      status
        ? db.projects.where("status").equals(status).toArray()
        : db.projects.toArray(),
    [status],
  );
}

export function useProject(id: number) {
  return useLiveQuery(() => db.projects.get(id), [id]);
}

// ---------------------------------------------------------------------------
// Health hooks
// ---------------------------------------------------------------------------

export function useHealthLogs(limit?: number) {
  return useLiveQuery(() =>
    limit
      ? db.healthLogs.orderBy("date").reverse().limit(limit).toArray()
      : db.healthLogs.orderBy("date").reverse().toArray(),
  );
}

export function useHealthLog(date: string) {
  return useLiveQuery(
    () => db.healthLogs.where("date").equals(date).first(),
    [date],
  );
}

// ---------------------------------------------------------------------------
// Habits hooks
// ---------------------------------------------------------------------------

export function useTodayHabits() {
  return useLiveQuery(() =>
    db.habits.where("date").equals(today()).first(),
  );
}

export function useHabitStreak(habitName: string) {
  return useLiveQuery(async () => {
    const all = await db.habits.orderBy("date").reverse().toArray();
    let streak = 0;
    for (const record of all) {
      if (record.habits[habitName]) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  }, [habitName]);
}

// ---------------------------------------------------------------------------
// CRUD — Study Sessions
// ---------------------------------------------------------------------------

export async function addStudySession(
  session: Omit<StudySession, "id" | "createdAt">,
) {
  return db.studySessions.add({
    ...session,
    createdAt: new Date(),
  } as StudySession);
}

export async function updateStudySession(
  id: number,
  changes: Partial<Omit<StudySession, "id" | "createdAt">>,
) {
  return db.studySessions.update(id, changes);
}

export async function deleteStudySession(id: number) {
  return db.studySessions.delete(id);
}

// ---------------------------------------------------------------------------
// CRUD — Journal Entries (upsert by date)
// ---------------------------------------------------------------------------

export async function saveJournalEntry(
  entry: Omit<JournalEntry, "id" | "createdAt" | "updatedAt">,
) {
  const existing = await db.journalEntries
    .where("date")
    .equals(entry.date)
    .first();
  const now = new Date();

  if (existing) {
    return db.journalEntries.update(existing.id, {
      ...entry,
      updatedAt: now,
    });
  }

  return db.journalEntries.add({
    ...entry,
    createdAt: now,
    updatedAt: now,
  } as JournalEntry);
}

export async function deleteJournalEntry(id: number) {
  return db.journalEntries.delete(id);
}

// ---------------------------------------------------------------------------
// CRUD — Notes
// ---------------------------------------------------------------------------

export async function addNote(note: Omit<Note, "id" | "createdAt" | "updatedAt">) {
  const now = new Date();
  return db.notes.add({
    ...note,
    createdAt: now,
    updatedAt: now,
  } as Note);
}

export async function updateNote(
  id: number,
  changes: Partial<Omit<Note, "id" | "createdAt">>,
) {
  return db.notes.update(id, { ...changes, updatedAt: new Date() });
}

export async function deleteNote(id: number) {
  return db.notes.delete(id);
}

// ---------------------------------------------------------------------------
// CRUD — Projects
// ---------------------------------------------------------------------------

export async function addProject(
  project: Omit<Project, "id" | "createdAt" | "updatedAt">,
) {
  const now = new Date();
  return db.projects.add({
    ...project,
    createdAt: now,
    updatedAt: now,
  } as Project);
}

export async function updateProject(
  id: number,
  changes: Partial<Omit<Project, "id" | "createdAt">>,
) {
  return db.projects.update(id, { ...changes, updatedAt: new Date() });
}

export async function deleteProject(id: number) {
  return db.projects.delete(id);
}

// ---------------------------------------------------------------------------
// CRUD — Health Logs (upsert by date)
// ---------------------------------------------------------------------------

export async function saveHealthLog(
  log: Omit<HealthLog, "id" | "createdAt">,
) {
  const existing = await db.healthLogs
    .where("date")
    .equals(log.date)
    .first();

  if (existing) {
    return db.healthLogs.update(existing.id, log);
  }

  return db.healthLogs.add({
    ...log,
    createdAt: new Date(),
  } as HealthLog);
}

// ---------------------------------------------------------------------------
// CRUD — Habits (upsert by date)
// ---------------------------------------------------------------------------

export async function saveHabits(
  date: string,
  habits: Record<string, boolean>,
) {
  const existing = await db.habits.where("date").equals(date).first();

  if (existing) {
    return db.habits.update(existing.id, { habits });
  }

  return db.habits.add({ date, habits } as HabitRecord);
}

// ---------------------------------------------------------------------------
// Guitar Progress
// ---------------------------------------------------------------------------

export function useGuitarProgress() {
  return useLiveQuery(async () => {
    const record = await db.guitarProgress.toCollection().first();
    return record ?? null; // null = no record, undefined = still loading
  });
}

export async function saveGuitarProgress(
  level: GuitarLevel,
  completedItems: Record<string, boolean> = {},
) {
  const existing = await db.guitarProgress.toCollection().first();

  if (existing) {
    return db.guitarProgress.update(existing.id, {
      level,
      completedItems,
      updatedAt: new Date(),
    });
  }

  return db.guitarProgress.add({
    level,
    completedItems,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as GuitarProgress);
}

export async function toggleGuitarItem(itemKey: string) {
  const existing = await db.guitarProgress.toCollection().first();
  if (!existing) return;

  const updated = { ...existing.completedItems };
  updated[itemKey] = !updated[itemKey];

  return db.guitarProgress.update(existing.id, {
    completedItems: updated,
    updatedAt: new Date(),
  });
}

export async function resetGuitarProgress() {
  return db.guitarProgress.clear();
}

export function useGuitarLogs() {
  return useLiveQuery(() => db.guitarLogs.orderBy('id').reverse().toArray());
}

export async function addGuitarLog(text: string) {
  return db.guitarLogs.add({ text, date: today(), createdAt: new Date() } as GuitarLog);
}

export async function deleteGuitarLog(id: number) {
  return db.guitarLogs.delete(id);
}
