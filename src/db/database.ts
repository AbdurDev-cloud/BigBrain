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
};

db.version(1).stores({
  studySessions: "++id, date, subject",
  journalEntries: "++id, &date",
  notes: "++id, category",
  projects: "++id, status",
  healthLogs: "++id, &date",
  habits: "++id, &date",
});

export { db };
