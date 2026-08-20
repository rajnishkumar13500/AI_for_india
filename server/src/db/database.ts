import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSchema, initialDatabaseState } from './schema.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'store.json');

export class Database {
  private static instance: Database;
  private state: DatabaseSchema;
  private isSaving: boolean = false;
  private pendingSave: boolean = false;

  private constructor() {
    this.ensureDataDirectory();
    this.state = this.loadData();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private ensureDataDirectory(): void {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const uploadsDir = path.resolve(__dirname, '../../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return { ...initialDatabaseState, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.error('Failed to read database file, initializing with empty state:', err);
    }
    return { ...initialDatabaseState };
  }

  public async save(): Promise<void> {
    if (this.isSaving) {
      this.pendingSave = true;
      return;
    }

    this.isSaving = true;
    try {
      const tempFile = `${DB_FILE}.tmp`;
      await fs.promises.writeFile(tempFile, JSON.stringify(this.state, null, 2), 'utf-8');
      await fs.promises.rename(tempFile, DB_FILE);
    } catch (err) {
      console.error('Database write error:', err);
    } finally {
      this.isSaving = false;
      if (this.pendingSave) {
        this.pendingSave = false;
        this.save();
      }
    }
  }

  public getState(): DatabaseSchema {
    return this.state;
  }

  public async reset(): Promise<void> {
    this.state = { ...initialDatabaseState };
    await this.save();
  }
}

export const db = Database.getInstance();
