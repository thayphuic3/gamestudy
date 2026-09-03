/**
 * Server chính của ứng dụng Game Luyện Tốc Độ Gõ Bàn Phím Lớp Học
 * Sử dụng Node.js (Express), Socket.io và SQLite (sql.js WASM tương thích 100%).
 */

import express from 'express';
import http from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import initSqlJs from 'sql.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const httpServer = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Cấu hình Socket.io
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Phục vụ các file tĩnh trong thư mục public
const publicPath = path.join(__dirname, 'public');
app.use(express.static(publicPath));

// -------------------------------------------------------------
// KHỞI TẠO CƠ SỞ DỮ LIỆU SQLITE (SQL.JS)
// -------------------------------------------------------------
const DB_PATH = path.join(__dirname, 'typing_game.db');
let db = null;

async function initDatabase() {
  const SQL = await initSqlJs();
  if (fs.existsSync(DB_PATH)) {
    try {
      const fileBuffer = fs.readFileSync(DB_PATH);
      db = new SQL.Database(fileBuffer);
      console.log('✅ Đã nạp dữ liệu SQLite từ:', DB_PATH);
    } catch (e) {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  db.run(`
    CREATE TABLE IF NOT EXISTS game_sessions (
      id TEXT PRIMARY KEY,
      created_at TEXT,
      duration INTEGER DEFAULT 60,
      word_count INTEGER DEFAULT 0,
      total_students INTEGER DEFAULT 0
    );
  `);

  db.run(`
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

  db.run(`
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

  saveDatabaseToDisk();
}

function saveDatabaseToDisk() {
  if (!db) return;
  try {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
  } catch (e) {
    console.error('Lỗi khi lưu SQLite file:', e);
  }
}

// -------------------------------------------------------------
// KHO NGÂN HÀNG TỪ VÀ CÂU MẪU (VIỆT & ANH)
// -------------------------------------------------------------
const WORD_PACKS = {
  vietnamese_idioms: [
    'Học thầy không tày học bạn',
    'Có công mài sắt có ngày nên kim',
    'Uống nước nhớ nguồn ăn quả nhớ người trồng cây',
    'Đi một ngày đàng học một sàng khôn',
    'Lá lành đùm lá rách',
    'Gần mực thì đen gần đèn thì rạng',
    'Học ăn học nói học gói học mở',
    'Muốn biết phải hỏi muốn giỏi phải học',
    'Tiên học lễ hậu học văn',
    'Một cây làm chẳng nên non ba cây chụm lại nên hòn núi cao',
    'Lời nói chẳng mất tiền mua lựa lời mà nói cho vừa lòng nhau',
    'Ăn quả nhớ kẻ trồng cây có danh có vọng nhớ thầy khi xưa',
    'Non cao cũng có đường trèo đường dẫu hiểm nghèo cũng có lối đi'
  ],
  vietnamese_words: [
    'học sinh', 'thầy giáo', 'cô giáo', 'trường học', 'lớp học', 'bảng đen', 'phấn trắng',
    'sách vở', 'bút mực', 'thước kẻ', 'máy tính', 'bàn phím', 'chuột máy', 'màn hình',
    'tương lai', 'thành công', 'chăm chỉ', 'kiên trì', 'sáng tạo', 'tự tin', 'trung thực'
  ],
  vietnamese_science: [
    'Mặt Trời là ngôi sao ở trung tâm của Hệ Mặt Trời',
    'Nước chiếm khoảng bảy mươi phần trăm bề mặt Trái Đất',
    'Cây xanh quang hợp hấp thụ khí cacbonic và giải phóng oxy',
    'Trí tuệ nhân tạo đang thay đổi cách con người làm việc và học tập'
  ],
  english_basic: [
    'The quick brown fox jumps over the lazy dog',
    'Practice makes perfect in typing and coding',
    'Knowledge is power when shared with others',
    'Never stop learning because life never stops teaching'
  ]
};

function getRandomWords(packId = 'vietnamese_idioms') {
  const list = WORD_PACKS[packId] || WORD_PACKS.vietnamese_idioms;
  return [...list].sort(() => Math.random() - 0.5);
}

// -------------------------------------------------------------
// QUẢN LÝ TRẠNG THÁI GAME TRÊN SERVER (AUTHORITATIVE STATE)
// -------------------------------------------------------------
const gameState = {
  status: 'waiting', // 'waiting' | 'playing' | 'ended'
  sessionId: `match_${Date.now()}`,
  duration: 60,
  remainingSeconds: 60,
  packId: 'vietnamese_idioms',
  words: [],
  timerInterval: null,
  students: new Map() // socketId -> Student Object
};

function getLeaderboard() {
  return Array.from(gameState.students.values()).sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.wpm !== a.wpm) return b.wpm - a.wpm;
    return b.accuracy - a.accuracy;
  });
}

function stopGameTimer() {
  if (gameState.timerInterval) {
    clearInterval(gameState.timerInterval);
    gameState.timerInterval = null;
  }
}

function endGameAndSave() {
  stopGameTimer();
  gameState.status = 'ended';
  gameState.remainingSeconds = 0;

  const leaderboard = getLeaderboard();

  // Lưu thông tin trận đấu vào SQLite
  if (db) {
    try {
      db.run(
        `INSERT OR REPLACE INTO game_sessions (id, created_at, duration, word_count, total_students)
         VALUES (?, ?, ?, ?, ?)`,
        [gameState.sessionId, new Date().toISOString(), gameState.duration, gameState.words.length, leaderboard.length]
      );

      for (const st of leaderboard) {
        db.run(
          `INSERT INTO student_scores (session_id, student_name, avatar, score, wpm, accuracy, words_completed, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [gameState.sessionId, st.name, st.avatar || '🐱', st.score, st.wpm, st.accuracy, st.wordsCompleted, new Date().toISOString()]
        );
      }
      saveDatabaseToDisk();
      console.log(`Đã lưu phiên chơi ${gameState.sessionId} vào SQLite.`);
    } catch (e) {
      console.error('Lỗi khi lưu SQLite:', e);
    }
  }

  // Thông báo tới tất cả học sinh và giáo viên
  io.emit('game:ended', {
    sessionId: gameState.sessionId,
    leaderboard
  });
}

// -------------------------------------------------------------
// XỬ LÝ SỰ KIỆN SOCKET.IO
// -------------------------------------------------------------
io.on('connection', (socket) => {
  // Gửi trạng thái ban đầu cho máy vừa kết nối
  socket.emit('game:state_sync', {
    status: gameState.status,
    remainingSeconds: gameState.remainingSeconds,
    duration: gameState.duration,
    words: gameState.words,
    students: Array.from(gameState.students.values()),
    leaderboard: getLeaderboard()
  });

  // 1. Học sinh bấm "Tham gia"
  socket.on('student:join', (data) => {
    const studentName = (data.name || 'Học sinh').trim();
    const avatar = data.avatar || '🐱';

    const student = {
      socketId: socket.id,
      name: studentName,
      avatar,
      score: 0,
      wpm: 0,
      accuracy: 100,
      wordsCompleted: 0,
      charsCorrect: 0
    };

    gameState.students.set(socket.id, student);

    socket.emit('student:joined_success', {
      student,
      gameState: {
        status: gameState.status,
        remainingSeconds: gameState.remainingSeconds,
        duration: gameState.duration,
        words: gameState.words
      }
    });

    // Cập nhật danh sách học sinh cho Giáo viên theo thời gian thực
    io.emit('students:update', Array.from(gameState.students.values()));
    io.emit('teacher:notification', {
      message: `Học sinh "${student.name}" ${student.avatar} đã vào phòng!`
    });
  });

  // 2. Giáo viên bấm "Bắt đầu Trò Chơi"
  socket.on('teacher:start_game', (options) => {
    if (gameState.status === 'playing') return;

    stopGameTimer();

    const duration = options?.duration || 60;
    const packId = options?.packId || 'vietnamese_idioms';

    gameState.status = 'playing';
    gameState.duration = duration;
    gameState.remainingSeconds = duration;
    gameState.packId = packId;
    gameState.sessionId = `match_${Date.now()}`;
    gameState.words = getRandomWords(packId);

    // Reset điểm số học sinh
    for (const st of gameState.students.values()) {
      st.score = 0;
      st.wpm = 0;
      st.accuracy = 100;
      st.wordsCompleted = 0;
      st.charsCorrect = 0;
    }

    // Bắn tín hiệu bắt đầu đồng loạt cho tất cả máy học sinh
    io.emit('game:started', {
      sessionId: gameState.sessionId,
      duration: gameState.duration,
      words: gameState.words,
      students: Array.from(gameState.students.values())
    });

    // Đồng hồ đếm ngược đồng bộ trên Server
    gameState.timerInterval = setInterval(() => {
      gameState.remainingSeconds--;

      io.emit('game:tick', {
        remainingSeconds: gameState.remainingSeconds,
        leaderboard: getLeaderboard()
      });

      if (gameState.remainingSeconds <= 0) {
        endGameAndSave();
      }
    }, 1000);
  });

  // 3. Học sinh cập nhật điểm gõ phím theo thời gian thực (+10 điểm mỗi từ đúng)
  socket.on('student:progress', (data) => {
    const student = gameState.students.get(socket.id);
    if (!student || gameState.status !== 'playing') return;

    student.score = data.score ?? student.score;
    student.wpm = data.wpm ?? student.wpm;
    student.accuracy = data.accuracy ?? student.accuracy;
    student.wordsCompleted = data.wordsCompleted ?? student.wordsCompleted;
    student.charsCorrect = data.charsCorrect ?? student.charsCorrect;

    // Gửi cập nhật trực tiếp đến màn hình Dashboard Giáo Viên
    io.emit('scores:update', {
      studentId: socket.id,
      student,
      leaderboard: getLeaderboard()
    });
  });

  // 4. Giáo viên dừng khẩn cấp
  socket.on('teacher:stop_game', () => {
    if (gameState.status === 'playing') {
      endGameAndSave();
    }
  });

  // 5. Giáo viên thiết lập lại phòng
  socket.on('teacher:reset_game', () => {
    stopGameTimer();
    gameState.status = 'waiting';
    gameState.remainingSeconds = gameState.duration;
    gameState.words = [];

    for (const st of gameState.students.values()) {
      st.score = 0;
      st.wpm = 0;
      st.accuracy = 100;
      st.wordsCompleted = 0;
      st.charsCorrect = 0;
    }

    io.emit('game:reset', {
      students: Array.from(gameState.students.values())
    });
  });

  // 6. Xử lý ngắt kết nối
  socket.on('disconnect', () => {
    if (gameState.students.has(socket.id)) {
      gameState.students.delete(socket.id);
      io.emit('students:update', Array.from(gameState.students.values()));
      io.emit('scores:update', {
        studentId: socket.id,
        leaderboard: getLeaderboard()
      });
    }
  });
});

// -------------------------------------------------------------
// CÁC ĐƯỜNG DẪN TRANG WEB & API
// -------------------------------------------------------------
app.get('/student', (req, res) => {
  res.sendFile(path.join(publicPath, 'student.html'));
});

app.get('/teacher', (req, res) => {
  res.sendFile(path.join(publicPath, 'teacher.html'));
});

app.get('/demo', (req, res) => {
  res.sendFile(path.join(publicPath, 'demo.html'));
});

// Lấy trạng thái hiện tại
app.get('/api/status', (req, res) => {
  res.json({
    status: gameState.status,
    remainingSeconds: gameState.remainingSeconds,
    duration: gameState.duration,
    studentCount: gameState.students.size,
    leaderboard: getLeaderboard()
  });
});

// Lấy lịch sử các trận đấu từ SQLite
app.get('/api/history', (req, res) => {
  if (!db) return res.json({ success: true, history: [] });

  try {
    const sessionsRes = db.exec(`SELECT * FROM game_sessions ORDER BY created_at DESC LIMIT 30`);
    if (!sessionsRes || sessionsRes.length === 0) return res.json({ success: true, history: [] });

    const columns = sessionsRes[0].columns;
    const sessions = sessionsRes[0].values.map(row => {
      const obj = {};
      columns.forEach((col, idx) => {
        obj[col] = row[idx];
      });
      return obj;
    });

    const scoresRes = db.exec(`SELECT * FROM student_scores ORDER BY score DESC`);
    const allScores = scoresRes && scoresRes.length > 0 
      ? scoresRes[0].values.map(row => {
          const obj = {};
          scoresRes[0].columns.forEach((col, idx) => {
            obj[col] = row[idx];
          });
          return obj;
        })
      : [];

    const history = sessions.map(sess => ({
      ...sess,
      leaderboard: allScores.filter(sc => sc.session_id === sess.id)
    }));

    res.json({ success: true, history });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

initDatabase().then(() => {
  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🚀 Typing Speed Game Server đang chạy tại PORT: ${PORT}`);
    console.log(`👨‍🏫 Giao diện Giáo viên: http://localhost:${PORT}/teacher`);
    console.log(`🎓 Giao diện Học sinh: http://localhost:${PORT}/student`);
    console.log(`⚡ Thử nghiệm song song (Split Demo): http://localhost:${PORT}/demo`);
    console.log(`===================================================`);
  });
});
