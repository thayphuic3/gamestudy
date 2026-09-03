import initSqlJs, { Database } from 'sql.js';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'typing_game.db');

export interface GameSession {
  id: string;
  created_at: string;
  duration: number;
  word_count: number;
  total_students: number;
}

export interface StudentScore {
  id?: number;
  session_id: string;
  student_name: string;
  avatar?: string;
  score: number;
  wpm: number;
  accuracy: number;
  words_completed: number;
  created_at: string;
}

class DatabaseService {
  private db: Database | null = null;
  private initPromise: Promise<Database>;

  constructor() {
    this.initPromise = this.init();
  }

  private async init(): Promise<Database> {
    const SQL = await initSqlJs();
    if (fs.existsSync(DB_PATH)) {
      try {
        const fileBuffer = fs.readFileSync(DB_PATH);
        this.db = new SQL.Database(fileBuffer);
        console.log('✅ Đã nạp dữ liệu SQLite từ:', DB_PATH);
      } catch (e) {
        this.db = new SQL.Database();
      }
    } else {
      this.db = new SQL.Database();
    }

    this.createTables();
    this.persist();
    return this.db;
  }

  private createTables() {
    if (!this.db) return;

    this.db.run(`
      CREATE TABLE IF NOT EXISTS game_sessions (
        id TEXT PRIMARY KEY,
        created_at TEXT,
        duration INTEGER DEFAULT 60,
        word_count INTEGER DEFAULT 0,
        total_students INTEGER DEFAULT 0
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS student_scores (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT,
        student_name TEXT NOT NULL,
        avatar TEXT,
        score INTEGER DEFAULT 0,
        wpm INTEGER DEFAULT 0,
        accuracy REAL DEFAULT 100,
        words_completed INTEGER DEFAULT 0,
        created_at TEXT
      );
    `);

    this.db.run(`
      CREATE TABLE IF NOT EXISTS students (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        avatar TEXT,
        best_score INTEGER DEFAULT 0,
        best_wpm INTEGER DEFAULT 0,
        games_played INTEGER DEFAULT 0,
        last_active TEXT
      );
    `);
  }

  private persist() {
    if (!this.db) return;
    try {
      const data = this.db.export();
      const buffer = Buffer.from(data);
      fs.writeFileSync(DB_PATH, buffer);
    } catch (e) {
      console.error('Lỗi khi lưu SQLite file:', e);
    }
  }

  public async saveGameSession(session: GameSession, scores: StudentScore[]): Promise<void> {
    await this.initPromise;
    if (!this.db) return;

    // Lưu session
    this.db.run(
      `INSERT OR REPLACE INTO game_sessions (id, created_at, duration, word_count, total_students)
       VALUES (?, ?, ?, ?, ?)`,
      [session.id, session.created_at || new Date().toISOString(), session.duration, session.word_count, scores.length]
    );

    // Lưu từng kết quả học sinh
    for (const s of scores) {
      this.db.run(
        `INSERT INTO student_scores (session_id, student_name, avatar, score, wpm, accuracy, words_completed, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [session.id, s.student_name, s.avatar || '🐱', s.score, s.wpm, s.accuracy, s.words_completed, new Date().toISOString()]
      );

      // Cập nhật danh bạ học sinh
      const existing = this.db.exec(`SELECT best_score, best_wpm, games_played FROM students WHERE name = '${s.student_name.replace(/'/g, "''")}'`);
      if (existing.length > 0 && existing[0].values.length > 0) {
        const [curScore, curWpm, curGames] = existing[0].values[0] as [number, number, number];
        this.db.run(
          `UPDATE students SET 
             avatar = ?, 
             best_score = MAX(?, ?), 
             best_wpm = MAX(?, ?), 
             games_played = ? + 1, 
             last_active = ? 
           WHERE name = ?`,
          [s.avatar || '🐱', curScore, s.score, curWpm, s.wpm, curGames, new Date().toISOString(), s.student_name]
        );
      } else {
        this.db.run(
          `INSERT INTO students (name, avatar, best_score, best_wpm, games_played, last_active)
           VALUES (?, ?, ?, ?, 1, ?)`,
          [s.student_name, s.avatar || '🐱', s.score, s.wpm, new Date().toISOString()]
        );
      }
    }

    this.persist();
  }

  public async getHistory(limit: number = 30): Promise<any[]> {
    await this.initPromise;
    if (!this.db) return [];

    const sessionsRes = this.db.exec(`SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT ${limit}`);
    if (!sessionsRes || sessionsRes.length === 0) return [];

    const columns = sessionsRes[0].columns;
    const sessions = sessionsRes[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    const scoresRes = this.db.exec(`SELECT * FROM student_scores ORDER BY score DESC`);
    const allScores = scoresRes && scoresRes.length > 0 
      ? scoresRes[0].values.map(row => {
          const obj: any = {};
          scoresRes[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        })
      : [];

    return sessions.map(sess => ({
      ...sess,
      leaderboard: allScores.filter(sc => sc.session_id === sess.id)
    }));
  }

  public async getTopStudents(limit: number = 50): Promise<any[]> {
    await this.initPromise;
    if (!this.db) return [];

    const res = this.db.exec(`SELECT * FROM students ORDER BY best_score DESC, best_wpm DESC LIMIT ${limit}`);
    if (!res || res.length === 0) return [];

    const columns = res[0].columns;
    return res[0].values.map(row => {
      const obj: any = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });
  }
}

export const dbService = new DatabaseService();
