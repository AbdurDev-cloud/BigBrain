import Dexie from "dexie";
import type { EntityTable } from "dexie";

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

export interface StudySession {
  id: number;
  date: string;
  subject: string;
  topic: string;
  timeSpent: number; // minutes
  understood: string;
  notUnderstood: string;
  practiceQuestions: number;
  confidence: number; // 1-10
  createdAt: Date;
}

export interface JournalEntry {
  id: number;
  date: string;
  title: string;
  content: string; // markdown
  mood?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Note {
  id: number;
  title: string;
  category: string;
  content: string; // markdown
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
}

export interface Project {
  id: number;
  name: string;
  description: string;
  status: "active" | "completed" | "paused";
  tasks: ProjectTask[];
  notes: string;
  problems: string;
  improvements: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface HealthLog {
  id: number;
  date: string;
  weight: number | null;
  water: number | null;
  exercise: string;
  exerciseMinutes: number | null;
  sleep: number | null;
  smoking: boolean;
  weed: boolean;
  createdAt: Date;
}

export interface HabitRecord {
  id: number;
  date: string;
  habits: Record<string, boolean>;
}

export type GuitarLevel = 'beginner' | 'basics' | 'advanced';

export interface GuitarProgress {
  id: number;
  level: GuitarLevel;
  completedItems: Record<string, boolean>; // key: "stageIndex-itemIndex"
  createdAt: Date;
  updatedAt: Date;
}

export interface GuitarLog {
  id: number;
  title: string;
  type?: string;
  date: string;
  timeSpent?: number;
  notes?: string;
  tags?: string[];
  text?: string;
  createdAt: Date;
}

// ---------------------------------------------------------------------------
// Database
// ---------------------------------------------------------------------------

const db = new Dexie("BigBrainDB") as Dexie & {
  studySessions: EntityTable<StudySession, "id">;
  journalEntries: EntityTable<JournalEntry, "id">;
  notes: EntityTable<Note, "id">;
  projects: EntityTable<Project, "id">;
  healthLogs: EntityTable<HealthLog, "id">;
  habits: EntityTable<HabitRecord, "id">;
  guitarProgress: EntityTable<GuitarProgress, "id">;
  guitarLogs: EntityTable<GuitarLog, "id">;
};

db.version(1).stores({
  studySessions: "++id, date, subject",
  journalEntries: "++id, &date",
  notes: "++id, category",
  projects: "++id, status",
  healthLogs: "++id, &date",
  habits: "++id, &date",
});

db.version(2).stores({
  studySessions: "++id, date, subject",
  journalEntries: "++id, &date",
  notes: "++id, category",
  projects: "++id, status",
  healthLogs: "++id, &date",
  habits: "++id, &date",
  guitarProgress: "++id",
});

db.version(3).stores({
  studySessions: "++id, date, subject",
  journalEntries: "++id, &date",
  notes: "++id, category",
  projects: "++id, status",
  healthLogs: "++id, &date",
  habits: "++id, &date",
  guitarProgress: "++id",
  guitarLogs: "++id, date",
});

export { db };
