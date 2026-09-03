import React, { useState, useEffect } from 'react';
import { 
  Laptop, 
  Users, 
  Play, 
  Trophy, 
  ExternalLink, 
  Code, 
  Database, 
  Timer, 
  CheckCircle2, 
  RefreshCw, 
  BookOpen, 
  SplitSquareVertical, 
  Monitor, 
  Sparkles,
  Server as ServerIcon,
  Flame,
  Layers
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'split' | 'student' | 'teacher' | 'docs'>('split');
  const [serverStatus, setServerStatus] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const fetchStatus = async () => {
    try {
      setLoadingStatus(true);
      const res = await fetch('/api/status');
      if (res.ok) {
        const data = await res.json();
        setServerStatus(data);
      }
    } catch (e) {
      console.log('Chờ server khởi động...');
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-[#FDFCF0] text-[#2D3436] flex flex-col font-sans selection:bg-[#FD79A8] selection:text-white">
      {/* TOP NAVIGATION HEADER - VIBRANT PALETTE #6C5CE7 WITH HARD BORDER & SHADOW */}
      <header className="border-b-4 border-[#2D3436] bg-[#6C5CE7] sticky top-0 z-50 px-4 py-3 shadow-[0_4px_0px_0px_#2D3436]">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          {/* LOGO & TITLE */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border-2 border-[#2D3436] flex items-center justify-center text-xl shadow-[3px_3px_0px_0px_#2D3436]">
              <span className="text-[#6C5CE7] font-bold">⌨</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-black text-lg text-white tracking-tight leading-none">
                  TYPEMASTER ACADEMY <span className="text-[#A29BFE] font-normal italic text-sm">v2.0</span>
                </h1>
                <span className="hidden sm:inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]">
                  Lớp Học Real-time
                </span>
              </div>
              <p className="text-[11px] text-[#A29BFE] mt-0.5 font-medium">
                Node.js • Express • Socket.io • SQLite • HTML5 / CSS3 / JS Thuần
              </p>
            </div>
          </div>

          {/* VIEW SWITCHER TABS */}
          <div className="flex items-center gap-1.5 bg-[#2D3436]/20 p-1.5 rounded-2xl border-2 border-[#2D3436]">
            <button
              id="tab-split"
              onClick={() => setActiveTab('split')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'split'
                  ? 'bg-[#FFEAA7] text-[#2D3436] border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] translate-y-[-1px]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <SplitSquareVertical className="w-3.5 h-3.5" />
              <span>⚡ Màn Hình Đôi (Live Demo)</span>
            </button>

            <button
              id="tab-student"
              onClick={() => setActiveTab('student')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'student'
                  ? 'bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] translate-y-[-1px]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Monitor className="w-3.5 h-3.5" />
              <span>🎓 Học Sinh</span>
            </button>

            <button
              id="tab-teacher"
              onClick={() => setActiveTab('teacher')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'teacher'
                  ? 'bg-[#FF7675] text-white border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] translate-y-[-1px]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>👨‍🏫 Giáo Viên</span>
            </button>

            <button
              id="tab-docs"
              onClick={() => setActiveTab('docs')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black transition-all ${
                activeTab === 'docs'
                  ? 'bg-white text-[#2D3436] border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436] translate-y-[-1px]'
                  : 'text-white/90 hover:text-white hover:bg-white/10'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>📖 Mã Nguồn & Hướng Dẫn</span>
            </button>
          </div>

          {/* EXTERNAL POPUP LINKS */}
          <div className="hidden lg:flex items-center gap-2">
            <a
              href="/student"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-[#FFEAA7] text-[#2D3436] border-2 border-[#2D3436] text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] hover:translate-y-[-1px] transition-all"
              title="Mở giao diện học sinh trong tab mới để trải nghiệm độc lập"
            >
              <span>Học sinh</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href="/teacher"
              target="_blank"
              rel="noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FF7675] hover:bg-[#ff6564] text-white border-2 border-[#2D3436] text-xs font-black shadow-[3px_3px_0px_0px_#2D3436] hover:translate-y-[-1px] transition-all"
              title="Mở Dashboard giáo viên trong tab mới"
            >
              <span>Giáo viên</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      </header>

      {/* QUICK STATUS BAR - NEO-BRUTALIST VIBRANT ACCENT */}
      <div className="bg-[#FFEAA7] border-b-2 border-[#2D3436] px-4 py-2 text-xs text-[#2D3436] font-bold">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <span className="inline-flex items-center gap-2 bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_#2D3436]">
              <span className="w-2 h-2 rounded-full bg-[#00B894] animate-pulse"></span>
              Server: Online
            </span>
            <span className="inline-flex items-center gap-1.5 bg-white text-[#2D3436] border-2 border-[#2D3436] px-2.5 py-0.5 rounded-full text-xs font-black shadow-[2px_2px_0px_0px_#2D3436]">
              <span>🔥</span>
              <span>Firebase: Anonymous Auth (Không cần Gmail)</span>
            </span>
            {serverStatus && (
              <>
                <span className="text-[#2D3436]/40 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Trạng thái: <strong className="uppercase bg-white px-2 py-0.5 rounded-lg border border-[#2D3436]">{serverStatus.status}</strong></span>
                <span className="text-[#2D3436]/40 hidden sm:inline">•</span>
                <span className="hidden sm:inline">Học sinh online: <strong className="text-[#D63031] font-black">{serverStatus.studentCount || 0} bạn</strong></span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="bg-[#2D3436] text-white px-2 py-0.5 rounded font-black text-[10px] uppercase">Mẹo</span>
            <span className="text-[#2D3436] font-medium">Ở chế độ <strong>Màn hình đôi</strong>, bạn có thể gõ phím bên trái và xem điểm nhảy ngay trên màn hình Giáo viên bên phải!</span>
          </div>
        </div>
      </div>

      {/* CONTENT AREA */}
      <div className="flex-1 flex flex-col relative overflow-hidden">
        {/* 1. SPLIT SCREEN VIEW */}
        {activeTab === 'split' && (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y-4 md:divide-y-0 md:divide-x-4 divide-[#2D3436] h-[calc(100vh-105px)] bg-[#FDFCF0]">
            {/* CỘT HỌC SINH */}
            <div className="flex flex-col h-full bg-[#FDFCF0]">
              <div className="px-4 py-2 bg-[#6C5CE7] border-b-2 border-[#2D3436] text-xs font-black text-white flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-[#55EFC4]" />
                  GIAO DIỆN HỌC SINH (CLIENT)
                </span>
                <a
                  href="/student"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-white/30 transition"
                >
                  <span>Mở tab mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                id="previewStudentFrame"
                src="/student"
                className="w-full flex-1 border-0 bg-transparent"
                title="Màn hình Học sinh"
              />
            </div>

            {/* CỘT GIÁO VIÊN */}
            <div className="flex flex-col h-full bg-[#FDFCF0]">
              <div className="px-4 py-2 bg-[#00B894] border-b-2 border-[#2D3436] text-xs font-black text-white flex items-center justify-between shadow-sm">
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-[#FFEAA7]" />
                  BẢNG ĐIỀU KHIỂN GIÁO VIÊN (DASHBOARD)
                </span>
                <a
                  href="/teacher"
                  target="_blank"
                  rel="noreferrer"
                  className="bg-white/20 hover:bg-white/30 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-bold flex items-center gap-1 border border-white/30 transition"
                >
                  <span>Mở tab mới</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <iframe
                id="previewTeacherFrame"
                src="/teacher"
                className="w-full flex-1 border-0 bg-transparent"
                title="Màn hình Giáo viên"
              />
            </div>
          </div>
        )}

        {/* 2. STUDENT FULL SCREEN VIEW */}
        {activeTab === 'student' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-105px)] bg-[#FDFCF0]">
            <iframe
              src="/student"
              className="w-full flex-1 border-0"
              title="Giao diện Học sinh Đầy đủ"
            />
          </div>
        )}

        {/* 3. TEACHER FULL SCREEN VIEW */}
        {activeTab === 'teacher' && (
          <div className="flex-1 flex flex-col h-[calc(100vh-105px)] bg-[#FDFCF0]">
            <iframe
              src="/teacher"
              className="w-full flex-1 border-0"
              title="Dashboard Giáo viên Đầy đủ"
            />
          </div>
        )}

        {/* 4. CODE WALKTHROUGH & DOCUMENTATION VIEW */}
        {activeTab === 'docs' && (
          <div className="flex-1 overflow-y-auto p-6 max-w-5xl mx-auto w-full space-y-8 bg-[#FDFCF0]">
            {/* HERO CARD - VIBRANT NEO-BRUTALIST */}
            <div className="bg-[#6C5CE7] border-4 border-[#2D3436] rounded-[32px] p-6 sm:p-8 text-white shadow-[8px_8px_0px_0px_#2D3436]">
              <div className="inline-flex items-center gap-2 bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider mb-4 shadow-[3px_3px_0px_0px_#2D3436]">
                <Sparkles className="w-4 h-4 text-[#2D3436]" />
                Kiến Trúc Kỹ Thuật Đầy Đủ
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Game Luyện Tốc Độ Gõ Bàn Phím Thời Gian Thực Cho Lớp Học
              </h2>
              <p className="text-white/90 text-sm sm:text-base mt-2 leading-relaxed font-medium">
                Ứng dụng được thiết kế chuyên biệt cho các phòng máy vi tính và lớp học tin học. Học sinh gõ phím thi đua trực tiếp, điểm số (+10đ mỗi từ chuẩn xác) nhảy liên tục trên màn hình máy chiếu của giáo viên với âm thanh gõ sống động và lưu trữ SQLite/Firebase.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
                <div className="bg-white rounded-2xl border-2 border-[#2D3436] p-4 text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436]">
                  <div className="text-[#636E72] text-xs font-bold uppercase">Giao diện Học sinh</div>
                  <div className="font-black text-base mt-1 text-[#2D3436]">HTML5/CSS3/JS</div>
                </div>
                <div className="bg-[#FFEAA7] rounded-2xl border-2 border-[#2D3436] p-4 text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436]">
                  <div className="text-[#636E72] text-xs font-bold uppercase">Giao diện Giáo viên</div>
                  <div className="font-black text-base mt-1 text-[#2D3436]">Live Race Board</div>
                </div>
                <div className="bg-[#55EFC4] rounded-2xl border-2 border-[#2D3436] p-4 text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436]">
                  <div className="text-[#2D3436] text-xs font-bold uppercase">Thời gian thực (WS)</div>
                  <div className="font-black text-base mt-1 text-[#00B894]">Socket.io</div>
                </div>
                <div className="bg-[#FAB1A0] rounded-2xl border-2 border-[#2D3436] p-4 text-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436]">
                  <div className="text-[#2D3436] text-xs font-bold uppercase">Cơ sở dữ liệu</div>
                  <div className="font-black text-base mt-1 text-[#D63031]">SQLite / Firebase</div>
                </div>
              </div>
            </div>

            {/* CẤU TRÚC THƯ MỤC DỰ ÁN */}
            <div className="bg-white border-4 border-[#2D3436] rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2D3436]">
              <h3 className="text-lg font-black text-[#2D3436] flex items-center gap-2 mb-4 uppercase">
                <Layers className="w-5 h-5 text-[#6C5CE7]" />
                Cấu Trúc Thư Mục Dự Án (Project Structure)
              </h3>
              <pre className="bg-[#2D3436] p-4 rounded-2xl text-xs font-mono text-[#55EFC4] overflow-x-auto border-2 border-[#2D3436] leading-relaxed shadow-[4px_4px_0px_0px_#636E72]">
{`typing-game-classroom/
├── server.js              # Server chính Node.js (Express + Socket.io + SQLite)
├── server.ts              # Server TypeScript (dành cho môi trường tsx/esbuild)
├── typing_game.db         # Cơ sở dữ liệu SQLite tự động sinh (lưu học sinh & lịch sử)
├── package.json           # Danh sách thư viện và scripts khởi chạy
├── public/
│   ├── student.html       # Giao diện Học sinh (HTML/CSS/JS thuần, highlight ký tự, âm thanh)
│   ├── teacher.html       # Dashboard Giáo viên (Điều khiển, đua tốc độ real-time, podium vinh quang)
│   ├── demo.html          # Chế độ thử nghiệm 2 màn hình song song (Split Screen)
│   └── index.html         # Trang học sinh chính
└── src/
    ├── db.ts              # Service quản lý bảng SQLite (sessions, scores, students)
    └── wordBank.ts        # Kho đề câu tiếng Việt (Tục ngữ, Ca dao, Khoa học, Tiếng Anh)`}
              </pre>
            </div>

            {/* HƯỚNG DẪN CÀI ĐẶT & CHẠY */}
            <div className="bg-white border-4 border-[#2D3436] rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2D3436] space-y-4">
              <h3 className="text-lg font-black text-[#2D3436] flex items-center gap-2 uppercase">
                <ServerIcon className="w-5 h-5 text-[#00B894]" />
                Hướng Dẫn Cài Đặt Thư Viện & Khởi Chạy
              </h3>

              <div className="space-y-3 text-xs text-[#2D3436]">
                <div className="p-4 rounded-2xl bg-[#FFEAA7] border-2 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]">
                  <div className="font-black text-sm text-[#2D3436] mb-1">Bước 1: Cài đặt các thư viện cần thiết</div>
                  <pre className="text-[#D63031] font-mono text-xs font-bold">npm install express socket.io sql.js</pre>
                </div>

                <div className="p-4 rounded-2xl bg-[#55EFC4]/30 border-2 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]">
                  <div className="font-black text-sm text-[#2D3436] mb-1">Bước 2: Khởi động Server</div>
                  <pre className="text-[#00B894] font-mono text-xs font-bold">node server.js</pre>
                  <p className="text-[#636E72] mt-1 font-medium">Hoặc dùng script phát triển: <code className="text-[#6C5CE7] font-bold">npm run dev</code></p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FDFCF0] border-2 border-[#2D3436] shadow-[3px_3px_0px_0px_#2D3436]">
                  <div className="font-black text-sm text-[#2D3436] mb-1">Bước 3: Truy cập vào ứng dụng trên trình duyệt</div>
                  <ul className="list-disc list-inside space-y-1 text-[#636E72] font-semibold mt-1">
                    <li>Dành cho Giáo viên: <code className="text-[#6C5CE7] font-bold">http://localhost:3000/teacher</code></li>
                    <li>Dành cho Học sinh: <code className="text-[#FF7675] font-bold">http://localhost:3000/student</code></li>
                    <li>Thử nghiệm song song: <code className="text-[#00B894] font-bold">http://localhost:3000/demo</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {/* LUỒNG HOẠT ĐỘNG THỜI GIAN THỰC */}
            <div className="bg-white border-4 border-[#2D3436] rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2D3436]">
              <h3 className="text-lg font-black text-[#2D3436] flex items-center gap-2 mb-4 uppercase">
                <Timer className="w-5 h-5 text-[#FF7675]" />
                Luồng Dữ Liệu Socket.io Thời Gian Thực (4 Bước)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-[#FFEAA7] border-2 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] space-y-1.5">
                  <div className="font-black text-[#2D3436] text-sm uppercase">1. Đăng ký tham gia (Student Join)</div>
                  <p className="text-[#636E72] font-medium leading-relaxed">
                    Học sinh nhập tên & chọn avatar ➔ emit <code className="text-[#D63031] font-bold">student:join</code> ➔ Server cập nhật danh sách và phát <code className="text-[#00B894] font-bold">students:update</code> tới Dashboard Giáo viên ngay lập tức.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#55EFC4]/40 border-2 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] space-y-1.5">
                  <div className="font-black text-[#00B894] text-sm uppercase">2. Khởi động trận đấu (Start Game)</div>
                  <p className="text-[#636E72] font-medium leading-relaxed">
                    Giáo viên chọn gói đề & thời gian ➔ emit <code className="text-[#D63031] font-bold">teacher:start_game</code> ➔ Server kích hoạt bộ đếm ngược 60s và phát <code className="text-[#6C5CE7] font-bold">game:started</code> đồng bộ trên tất cả máy học sinh.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAB1A0] border-2 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] space-y-1.5">
                  <div className="font-black text-[#D63031] text-sm uppercase">3. Gõ phím & Cộng điểm (Live Typing)</div>
                  <p className="text-[#636E72] font-medium leading-relaxed">
                    Học sinh gõ đúng từng từ được cộng <strong className="text-[#2D3436] underline">+10 điểm</strong>. Client emit <code className="text-[#D63031] font-bold">student:progress</code> ➔ Giáo viên thấy xe đua avatar của học sinh tiến lên theo thời gian thực!
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#A29BFE]/30 border-2 border-[#2D3436] shadow-[4px_4px_0px_0px_#2D3436] space-y-1.5">
                  <div className="font-black text-[#6C5CE7] text-sm uppercase">4. Kết thúc & Vinh quang (End & Podium)</div>
                  <p className="text-[#636E72] font-medium leading-relaxed">
                    Hết 60 giây, bàn phím tự động khóa. Server phát <code className="text-[#D63031] font-bold">game:ended</code>, tự động ghi dữ liệu vào SQLite và hiển thị bục vinh quang 🥇🥈🥉 cùng pháo hoa rực rỡ!
                  </p>
                </div>
              </div>
            </div>

            {/* PHƯƠNG ÁN KẾT NỐI FIREBASE & ANONYMOUS AUTH */}
            <div className="bg-white border-4 border-[#2D3436] rounded-[32px] p-6 shadow-[8px_8px_0px_0px_#2D3436] space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <h3 className="text-lg font-black text-[#2D3436] flex items-center gap-2 uppercase">
                  <Flame className="w-5 h-5 text-[#FF7675]" />
                  Dự Án Firebase: typinggameschool
                </h3>
                <span className="px-3 py-1 rounded-full text-xs font-black bg-[#55EFC4] text-[#2D3436] border-2 border-[#2D3436] shadow-[2px_2px_0px_0px_#2D3436]">
                  🔥 typinggameschool (RTDB & Firestore)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-[#55EFC4]/20 border-2 border-[#00B894] text-xs space-y-2">
                <div className="font-black text-sm text-[#00B894] flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#00B894]" />
                  Dự Án Firebase Của Trường Học Đã Được Kích Hoạt
                </div>
                <p className="text-[#2D3436] font-medium leading-relaxed">
                  Hệ thống đã nạp trực tiếp cấu hình dự án <strong>typinggameschool</strong> của bạn. Dữ liệu gõ phím được đồng bộ song song:
                </p>
                <ul className="list-disc list-inside space-y-1 text-[#2D3436] font-semibold pl-2">
                  <li><strong>Realtime Database</strong>: <code className="text-[#6C5CE7] font-bold">https://typinggameschool-default-rtdb.firebaseio.com</code> (Lưu tức thời tiến độ thi đấu của học sinh).</li>
                  <li><strong>Cloud Firestore</strong>: <code className="text-[#D63031] font-bold">students</code> và <code className="text-[#D63031] font-bold">match_history</code>.</li>
                  <li><strong>Không cần Gmail</strong>: Học sinh chỉ cần nhập Tên để vào phòng máy thi ngay, hệ thống tự cấp định danh an toàn.</li>
                </ul>
              </div>

              <pre className="bg-[#2D3436] p-4 rounded-2xl text-xs font-mono text-[#55EFC4] overflow-x-auto border-2 border-[#2D3436] leading-relaxed shadow-[4px_4px_0px_0px_#636E72]">
{`<script type="module">
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-app.js";
  import { getAnalytics } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-analytics.js";

  const firebaseConfig = {
    apiKey: "AIzaSyDkqfF-kR5NLpIn8iLXAkFJ43Ej-gyrNfw",
    authDomain: "typinggameschool.firebaseapp.com",
    databaseURL: "https://typinggameschool-default-rtdb.firebaseio.com",
    projectId: "typinggameschool",
    storageBucket: "typinggameschool.firebasestorage.app",
    messagingSenderId: "176666838245",
    appId: "1:176666838245:web:5c356fe5173b8d468f400c",
    measurementId: "G-32WLKNPE0N"
  };

  const app = initializeApp(firebaseConfig);
  const analytics = getAnalytics(app);
</script>`}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
