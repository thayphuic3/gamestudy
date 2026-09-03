import express, { Request, Response } from 'express';
import fs from 'fs';
import http from 'http';
import path from 'path';
import { Server, Socket } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import { dbService, GameSession, StudentScore } from './src/db.js';
import { WORD_PACKS, getRandomText } from './src/wordBank.js';

interface StudentData {
  socketId: string;
  name: string;
  avatar: string;
  score: number;
  wpm: number;
  accuracy: number;
  wordsCompleted: number;
  charsCorrect: number;
  isFinished: boolean;
  joinedAt: number;
}

const app = express();
const httpServer = http.createServer(app);
const PORT = 3000;

// Khởi tạo Socket.io với CORS đầy đủ
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

app.use(express.json());

// Cho phép truy cập tĩnh từ thư mục public
const publicPath = path.join(process.cwd(), 'public');
app.use(express.static(publicPath));

// Game State quản lý tập trung trên Server
let gameState = {
  status: 'waiting' as 'waiting' | 'starting' | 'playing' | 'ended',
  sessionId: `sess_${Date.now()}`,
  duration: 60,
  remainingSeconds: 60,
  packId: 'vietnamese_idioms',
  words: [] as string[],
  startTime: 0,
  timerInterval: null as NodeJS.Timeout | null,
  students: new Map<string, StudentData>()
};

function getLeaderboard(): StudentData[] {
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

async function endGameAndSave() {
  stopGameTimer();
  gameState.status = 'ended';
  gameState.remainingSeconds = 0;

  const leaderboard = getLeaderboard();

  // Lưu vào SQLite
  try {
    const sessionRecord: GameSession = {
      id: gameState.sessionId,
      created_at: new Date().toISOString(),
      duration: gameState.duration,
      word_count: gameState.words.length,
      total_students: leaderboard.length
    };

    const scoresRecord: StudentScore[] = leaderboard.map(st => ({
      session_id: gameState.sessionId,
      student_name: st.name,
      avatar: st.avatar,
      score: st.score,
      wpm: st.wpm,
      accuracy: st.accuracy,
      words_completed: st.wordsCompleted,
      created_at: new Date().toISOString()
    }));

    await dbService.saveGameSession(sessionRecord, scoresRecord);
    console.log(`Đã lưu phiên chơi ${gameState.sessionId} vào cơ sở dữ liệu SQLite.`);

    // Đồng bộ lên Firebase Realtime Database của trường (typinggameschool)
    try {
      const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
      if (fs.existsSync(configPath)) {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        if (config.databaseURL) {
          fetch(`${config.databaseURL}/matches/${gameState.sessionId}.json`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: gameState.sessionId,
              duration: gameState.duration,
              totalStudents: leaderboard.length,
              leaderboard,
              timestamp: Date.now()
            })
          }).then(() => {
            console.log(`⚡ Đã đồng bộ trận đấu ${gameState.sessionId} lên Firebase Realtime Database`);
          }).catch((e: any) => {
            console.warn('Lỗi gửi Firebase RTDB:', e.message);
          });
        }
      }
    } catch (_) {}
  } catch (err) {
    console.error('Lỗi khi lưu kết quả vào SQLite:', err);
  }

  // Thông báo tới tất cả client
  io.emit('game:ended', {
    sessionId: gameState.sessionId,
    leaderboard
  });
}

// Socket.io Events
io.on('connection', (socket: Socket) => {
  console.log(`Client kết nối: ${socket.id}`);

  // Gửi trạng thái hiện tại cho người vừa kết nối
  socket.emit('game:state_sync', {
    status: gameState.status,
    remainingSeconds: gameState.remainingSeconds,
    duration: gameState.duration,
    words: gameState.words,
    students: Array.from(gameState.students.values()),
    leaderboard: getLeaderboard()
  });

  // 1. Học sinh đăng ký tham gia
  socket.on('student:join', (data: { name: string; avatar?: string }) => {
    const studentName = (data.name || 'Học sinh ẩn danh').trim();
    const avatarList = ['🐱', '🐶', '🦊', '🐼', '🦁', '🐯', '🦄', '🚀', '⭐', '⚡', '🔥', '🏆'];
    const avatar = data.avatar || avatarList[Math.floor(Math.random() * avatarList.length)];

    const student: StudentData = {
      socketId: socket.id,
      name: studentName,
      avatar,
      score: 0,
      wpm: 0,
      accuracy: 100,
      wordsCompleted: 0,
      charsCorrect: 0,
      isFinished: false,
      joinedAt: Date.now()
    };

    gameState.students.set(socket.id, student);

    // Báo cho học sinh tham gia thành công
    socket.emit('student:joined_success', {
      student,
      gameState: {
        status: gameState.status,
        remainingSeconds: gameState.remainingSeconds,
        duration: gameState.duration,
        words: gameState.words
      }
    });

    // Thông báo cho toàn bộ lớp và Giáo viên cập nhật danh sách
    const studentList = Array.from(gameState.students.values());
    io.emit('students:update', studentList);
    io.emit('teacher:notification', {
      type: 'info',
      message: `Học sinh "${student.name}" ${student.avatar} vừa tham gia phòng!`
    });
  });

  // 2. Giáo viên khởi động trò chơi
  socket.on('teacher:start_game', (options?: { duration?: number; packId?: string }) => {
    if (gameState.status === 'playing') return;

    stopGameTimer();

    const duration = options?.duration && options.duration > 0 ? options.duration : 60;
    const packId = options?.packId || 'vietnamese_idioms';

    gameState.status = 'playing';
    gameState.duration = duration;
    gameState.remainingSeconds = duration;
    gameState.packId = packId;
    gameState.sessionId = `sess_${Date.now()}`;
    gameState.words = getRandomText(packId);
    gameState.startTime = Date.now();

    // Đặt lại điểm số của các học sinh hiện tại
    for (const [id, student] of gameState.students.entries()) {
      student.score = 0;
      student.wpm = 0;
      student.accuracy = 100;
      student.wordsCompleted = 0;
      student.charsCorrect = 0;
      student.isFinished = false;
    }

    // Phát sự kiện bắt đầu game tới tất cả máy học sinh & giáo viên
    io.emit('game:started', {
      sessionId: gameState.sessionId,
      duration: gameState.duration,
      words: gameState.words,
      startTime: gameState.startTime,
      students: Array.from(gameState.students.values())
    });

    console.log(`Trò chơi bắt đầu: ${gameState.duration}s, gói từ: ${packId}`);

    // Kích hoạt đồng hồ đếm ngược trên server (chính xác tuyệt đối)
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

  // 3. Học sinh cập nhật điểm gõ phím theo thời gian thực
  socket.on('student:progress', (data: {
    score: number;
    wpm: number;
    accuracy: number;
    wordsCompleted: number;
    charsCorrect: number;
  }) => {
    const student = gameState.students.get(socket.id);
    if (!student || gameState.status !== 'playing') return;

    student.score = data.score ?? student.score;
    student.wpm = data.wpm ?? student.wpm;
    student.accuracy = data.accuracy ?? student.accuracy;
    student.wordsCompleted = data.wordsCompleted ?? student.wordsCompleted;
    student.charsCorrect = data.charsCorrect ?? student.charsCorrect;

    // Gửi cập nhật tức thời (Real-time) cho Giáo viên và bảng xếp hạng
    io.emit('scores:update', {
      studentId: socket.id,
      student,
      leaderboard: getLeaderboard()
    });
  });

  // 4. Giáo viên kết thúc sớm trò chơi
  socket.on('teacher:stop_game', () => {
    if (gameState.status === 'playing') {
      endGameAndSave();
    }
  });

  // 5. Giáo viên thiết lập lại phòng chơi mới
  socket.on('teacher:reset_game', () => {
    stopGameTimer();
    gameState.status = 'waiting';
    gameState.remainingSeconds = gameState.duration;
    gameState.words = [];

    // Giữ danh sách học sinh nhưng reset điểm
    for (const [_, student] of gameState.students.entries()) {
      student.score = 0;
      student.wpm = 0;
      student.accuracy = 100;
      student.wordsCompleted = 0;
      student.charsCorrect = 0;
      student.isFinished = false;
    }

    io.emit('game:reset', {
      students: Array.from(gameState.students.values())
    });
  });

  // 6. Xử lý khi học sinh hoặc giáo viên ngắt kết nối
  socket.on('disconnect', () => {
    if (gameState.students.has(socket.id)) {
      const student = gameState.students.get(socket.id);
      gameState.students.delete(socket.id);
      io.emit('students:update', Array.from(gameState.students.values()));
      io.emit('scores:update', {
        studentId: socket.id,
        leaderboard: getLeaderboard()
      });
      if (student) {
        console.log(`Học sinh rời phòng: ${student.name}`);
      }
    }
  });
});

// REST API
app.get('/api/firebase-config', (_req: Request, res: Response) => {
  try {
    const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
    if (fs.existsSync(configPath)) {
      const configData = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      res.json({ success: true, config: configData });
    } else {
      res.status(404).json({ success: false, error: 'Firebase config file not found' });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/wordpacks', (_req: Request, res: Response) => {
  res.json({ success: true, data: WORD_PACKS });
});

app.get('/api/status', (_req: Request, res: Response) => {
  res.json({
    status: gameState.status,
    remainingSeconds: gameState.remainingSeconds,
    duration: gameState.duration,
    studentCount: gameState.students.size,
    leaderboard: getLeaderboard()
  });
});

app.get('/api/history', async (_req: Request, res: Response) => {
  try {
    const history = await dbService.getHistory(30);
    res.json({ success: true, history });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.get('/api/students/top', async (_req: Request, res: Response) => {
  try {
    const top = await dbService.getTopStudents(50);
    res.json({ success: true, top });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Route trực tiếp cho Giáo viên và Học sinh
app.get('/teacher', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'teacher.html'));
});

app.get('/student', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'student.html'));
});

app.get('/demo', (_req: Request, res: Response) => {
  res.sendFile(path.join(publicPath, 'demo.html'));
});

async function start() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Typing Speed Game Server đang chạy tại: http://localhost:${PORT}`);
    console.log(`👨‍🏫 Giao diện Giáo viên: http://localhost:${PORT}/teacher`);
    console.log(`🎓 Giao diện Học sinh: http://localhost:${PORT}/student`);
    console.log(`⚡ Giao diện Thử nghiệm song song: http://localhost:${PORT}/demo`);
  });
}

start();
