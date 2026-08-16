import { db } from './database';
import type {
  HabitRecord,
  HealthLog,
  JournalEntry,
  Note,
  Project,
  StudySession,
  GuitarProgress,
} from './database';

const BACKUP_VERSION = 1;
export const LAST_BACKUP_KEY = 'bigbrain-last-backup-at';

interface BigBrainBackup {
  version: number;
  exportedAt: string;
  data: {
    studySessions: StudySession[];
    journalEntries: JournalEntry[];
    notes: Note[];
    projects: Project[];
    healthLogs: HealthLog[];
    habits: HabitRecord[];
    guitarProgress: GuitarProgress[];
  };
}

function reviveDates<T>(rows: T[], keys: string[]) {
  return rows.map((row) => {
    const revived = { ...(row as object) } as Record<string, unknown>;
    for (const key of keys) {
      const value = revived[key];
      if (typeof value === 'string') revived[key] = new Date(value);
    }
    return revived as T;
  });
}

export async function createBackupBlob() {
  const payload: BigBrainBackup = {
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      studySessions: await db.studySessions.toArray(),
      journalEntries: await db.journalEntries.toArray(),
      notes: await db.notes.toArray(),
      projects: await db.projects.toArray(),
      healthLogs: await db.healthLogs.toArray(),
      habits: await db.habits.toArray(),
      guitarProgress: await db.guitarProgress.toArray(),
    },
  };

  localStorage.setItem(LAST_BACKUP_KEY, payload.exportedAt);
  return new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
}

export function downloadBackup(blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const date = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `bigbrain-backup-${date}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

export async function restoreBackupFromFile(file: File) {
  const text = await file.text();
  const parsed = JSON.parse(text) as BigBrainBackup;

  if (!parsed?.data || typeof parsed.version !== 'number') {
    throw new Error('Invalid backup file.');
  }

  const studySessions = reviveDates(parsed.data.studySessions || [], ['createdAt']);
  const journalEntries = reviveDates(parsed.data.journalEntries || [], ['createdAt', 'updatedAt']);
  const notes = reviveDates(parsed.data.notes || [], ['createdAt', 'updatedAt']);
  const projects = reviveDates(parsed.data.projects || [], ['createdAt', 'updatedAt']);
  const healthLogs = reviveDates(parsed.data.healthLogs || [], ['createdAt']);
  const habits = parsed.data.habits || [];
  const guitarProgress = reviveDates(parsed.data.guitarProgress || [], ['createdAt', 'updatedAt']);

  await db.transaction(
    'rw',
    [db.studySessions, db.journalEntries, db.notes, db.projects, db.healthLogs, db.habits, db.guitarProgress],
    async () => {
      await db.studySessions.clear();
      await db.journalEntries.clear();
      await db.notes.clear();
      await db.projects.clear();
      await db.healthLogs.clear();
      await db.habits.clear();

      if (studySessions.length) await db.studySessions.bulkAdd(studySessions as StudySession[]);
      if (journalEntries.length) await db.journalEntries.bulkAdd(journalEntries as JournalEntry[]);
      if (notes.length) await db.notes.bulkAdd(notes as Note[]);
      if (projects.length) await db.projects.bulkAdd(projects as Project[]);
      if (healthLogs.length) await db.healthLogs.bulkAdd(healthLogs as HealthLog[]);
      if (habits.length) await db.habits.bulkAdd(habits as HabitRecord[]);
      if (guitarProgress.length) await db.guitarProgress.bulkAdd(guitarProgress as GuitarProgress[]);
    },
  );

  localStorage.setItem(LAST_BACKUP_KEY, parsed.exportedAt || new Date().toISOString());
}
