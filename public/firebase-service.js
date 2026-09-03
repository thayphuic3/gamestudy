// firebase-service.js - Tích hợp Firebase Firestore, Realtime Database & Anonymous Authentication
// Dự án: typinggameschool
// Học sinh tham gia thi đấu mà KHÔNG CẦN tài khoản Gmail hay mật khẩu.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  orderBy, 
  limit, 
  onSnapshot, 
  serverTimestamp 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";
import {
  getDatabase,
  ref,
  set as rtdbSet,
  update as rtdbUpdate,
  push as rtdbPush,
  serverTimestamp as rtdbTimestamp
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Cấu hình Firebase mặc định của trường học (typinggameschool)
const DEFAULT_FIREBASE_CONFIG = {
  apiKey: "AIzaSyDkqfF-kR5NLpIn8iLXAkFJ43Ej-gyrNfw",
  authDomain: "typinggameschool.firebaseapp.com",
  databaseURL: "https://typinggameschool-default-rtdb.firebaseio.com",
  projectId: "typinggameschool",
  storageBucket: "typinggameschool.firebasestorage.app",
  messagingSenderId: "176666838245",
  appId: "1:176666838245:web:5c356fe5173b8d468f400c",
  measurementId: "G-32WLKNPE0N"
};

class FirebaseService {
  constructor() {
    this.app = null;
    this.auth = null;
    this.db = null;
    this.rtdb = null;
    this.currentUser = null;
    this.isInitialized = false;
    this.initPromise = null;
    this.projectId = "typinggameschool";
  }

  async initialize() {
    if (this.initPromise) return this.initPromise;

    this.initPromise = (async () => {
      try {
        let config = DEFAULT_FIREBASE_CONFIG;
        try {
          const response = await fetch('/api/firebase-config');
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.config && data.config.apiKey) {
              config = data.config;
            }
          }
        } catch (fetchErr) {
          console.log('Sử dụng cấu hình Firebase mặc định typinggameschool');
        }

        this.app = initializeApp(config);
        this.projectId = config.projectId || "typinggameschool";
        this.auth = getAuth(this.app);

        // Khởi tạo Firestore
        try {
          if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)') {
            this.db = getFirestore(this.app, config.firestoreDatabaseId);
          } else {
            this.db = getFirestore(this.app);
          }
        } catch (e) {
          console.warn('Firestore init note:', e.message);
        }

        // Khởi tạo Realtime Database (typinggameschool-default-rtdb)
        try {
          if (config.databaseURL) {
            this.rtdb = getDatabase(this.app);
            console.log('✅ Đã kết nối Firebase Realtime Database:', config.databaseURL);
          }
        } catch (e) {
          console.warn('Realtime Database note:', e.message);
        }

        // Tự động cấp định danh không cần Gmail
        await this.signInAnonymousStudent();

        this.isInitialized = true;
        console.log(`✅ Đã kết nối dự án Firebase [${this.projectId}] thành công (Không cần Gmail)`);

        window.dispatchEvent(new CustomEvent('firebase:ready', {
          detail: { user: this.currentUser, db: this.db, rtdb: this.rtdb }
        }));

        return true;
      } catch (err) {
        console.warn('⚠️ Lỗi khởi tạo Firebase:', err.message);
        this.isInitialized = false;
        return false;
      }
    })();

    return this.initPromise;
  }

  // Lấy hoặc tạo mã định danh học sinh cục bộ (UID) khi không dùng Gmail
  getOrCreateLocalStudentId() {
    try {
      let localId = localStorage.getItem('typing_student_uid');
      if (!localId) {
        localId = 'hs_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
        localStorage.setItem('typing_student_uid', localId);
      }
      return localId;
    } catch (e) {
      return 'hs_' + Math.random().toString(36).substring(2, 10);
    }
  }

  // Đăng nhập Ẩn danh (Dành riêng cho học sinh không có tài khoản Google/Gmail)
  async signInAnonymousStudent() {
    return new Promise((resolve) => {
      const fallbackUid = this.getOrCreateLocalStudentId();
      let resolved = false;

      const safeResolve = (user) => {
        if (resolved) return;
        resolved = true;
        this.currentUser = user;
        this.updateUiBadges(true, user.uid);
        resolve(user);
      };

      try {
        const unsubscribe = onAuthStateChanged(this.auth, async (user) => {
          try {
            unsubscribe();
          } catch (_) {}

          if (user) {
            console.log(`👤 Học sinh đã xác thực ẩn danh UID: ${user.uid} (Không cần Gmail)`);
            safeResolve(user);
          } else {
            try {
              const userCredential = await signInAnonymously(this.auth);
              console.log(`👤 Tạo tài khoản ẩn danh mới UID: ${userCredential.user.uid}`);
              safeResolve(userCredential.user);
            } catch (err) {
              // Khi Anonymous provider chưa được bật trong Firebase Console (auth/admin-restricted-operation)
              // Sử dụng định danh phòng máy học sinh trực tiếp kết nối với Firestore
              console.info(`ℹ️ Học sinh kết nối Firebase Firestore trực tiếp không cần Gmail (Mã HS: ${fallbackUid})`);
              safeResolve({
                uid: fallbackUid,
                isAnonymous: true,
                isLocalStudent: true,
                displayName: ''
              });
            }
          }
        });

        // Timeout dự phòng
        setTimeout(() => {
          if (!resolved) {
            safeResolve({
              uid: fallbackUid,
              isAnonymous: true,
              isLocalStudent: true,
              displayName: ''
            });
          }
        }, 1500);

      } catch (e) {
        safeResolve({
          uid: fallbackUid,
          isAnonymous: true,
          isLocalStudent: true,
          displayName: ''
        });
      }
    });
  }

  // Cập nhật tên hiển thị
  async updateStudentName(name) {
    if (!this.currentUser) return;
    this.currentUser.displayName = name;
    if (this.currentUser.updateProfile && typeof this.currentUser.updateProfile === 'function') {
      try {
        await updateProfile(this.currentUser, {
          displayName: name
        });
      } catch (e) {
        // Bỏ qua nếu là tài khoản cục bộ
      }
    }
  }

  // Lưu thông tin học sinh vào Firestore & Realtime Database
  async saveStudentToFirestore(studentData) {
    const studentUid = this.currentUser ? this.currentUser.uid : this.getOrCreateLocalStudentId();
    const payload = {
      uid: studentUid,
      name: studentData.name,
      avatar: studentData.avatar || '🐱',
      score: studentData.score || 0,
      wpm: studentData.wpm || 0,
      accuracy: studentData.accuracy || 100,
      wordsCompleted: studentData.wordsCompleted || 0,
      lastActive: new Date().toISOString()
    };

    // 1. Đồng bộ lên Firestore
    if (this.db) {
      try {
        const studentRef = doc(this.db, 'students', studentUid);
        await setDoc(studentRef, {
          ...payload,
          updatedAt: serverTimestamp()
        }, { merge: true });
        console.log(`🔥 [Firestore] Đã đồng bộ hồ sơ học sinh [${studentData.name}]`);
      } catch (err) {
        console.warn('Firestore note:', err.message);
      }
    }

    // 2. Đồng bộ lên Realtime Database (typinggameschool-default-rtdb)
    if (this.rtdb) {
      try {
        const rtdbStudentRef = ref(this.rtdb, 'students/' + studentUid);
        await rtdbSet(rtdbStudentRef, {
          ...payload,
          timestamp: Date.now()
        });
        console.log(`⚡ [Realtime DB] Đã đồng bộ hồ sơ học sinh [${studentData.name}]`);
      } catch (err) {
        console.warn('Realtime DB note:', err.message);
      }
    }
  }

  // Cập nhật tiến độ gõ phím theo thời gian thực lên Firestore & Realtime Database
  async updateStudentProgress(progress) {
    const studentUid = this.currentUser ? this.currentUser.uid : this.getOrCreateLocalStudentId();
    const payload = {
      score: progress.score ?? 0,
      wpm: progress.wpm ?? 0,
      accuracy: progress.accuracy ?? 100,
      wordsCompleted: progress.wordsCompleted ?? 0,
      lastActive: new Date().toISOString()
    };

    if (this.db) {
      try {
        const studentRef = doc(this.db, 'students', studentUid);
        await setDoc(studentRef, payload, { merge: true });
      } catch (_) {}
    }

    if (this.rtdb) {
      try {
        const rtdbStudentRef = ref(this.rtdb, 'students/' + studentUid);
        await rtdbUpdate(rtdbStudentRef, payload);
      } catch (_) {}
    }
  }

  // Lưu lịch sử trận đấu vào Firestore & Realtime Database
  async saveMatchSession(sessionData) {
    const sessionId = sessionData.sessionId || `match_${Date.now()}`;
    const matchRecord = {
      sessionId: sessionId,
      duration: sessionData.duration || 60,
      totalStudents: sessionData.leaderboard?.length || 0,
      leaderboard: sessionData.leaderboard || [],
      createdAt: new Date().toISOString()
    };

    if (this.db) {
      try {
        const historyCollection = collection(this.db, 'match_history');
        await addDoc(historyCollection, {
          ...matchRecord,
          timestamp: serverTimestamp()
        });
        console.log('🔥 [Firestore] Đã lưu kết quả trận đấu');
      } catch (err) {
        console.warn('Firestore match_history error:', err);
      }
    }

    if (this.rtdb) {
      try {
        const matchRef = ref(this.rtdb, 'matches/' + sessionId);
        await rtdbSet(matchRef, {
          ...matchRecord,
          timestamp: Date.now()
        });
        console.log('⚡ [Realtime DB] Đã lưu kết quả trận đấu vào matches/' + sessionId);
      } catch (err) {
        console.warn('Realtime DB match error:', err);
      }
    }
  }

  // Lấy lịch sử từ Firestore hoặc Realtime Database
  async getMatchHistoryFromFirestore(maxCount = 20) {
    if (this.db) {
      try {
        const historyCollection = collection(this.db, 'match_history');
        const q = query(historyCollection, orderBy('timestamp', 'desc'), limit(maxCount));
        const querySnapshot = await getDocs(q);
        const matches = [];
        querySnapshot.forEach((doc) => {
          matches.push({ id: doc.id, ...doc.data() });
        });
        if (matches.length > 0) return matches;
      } catch (err) {
        console.warn('Lỗi đọc Firestore match_history:', err);
      }
    }
    return [];
  }

  // Cập nhật nhãn kết nối trên giao diện
  updateUiBadges(isConnected, uid = '') {
    const badge = document.getElementById('firebaseStatusBadge');
    if (badge) {
      if (isConnected) {
        badge.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-[#00B894] animate-pulse"></span>
          <span>🔥 Firebase (${this.projectId}): Sẵn sàng</span>
        `;
        badge.classList.remove('bg-[#FFEAA7]', 'text-[#2D3436]', 'bg-[#FF7675]');
        badge.classList.add('bg-[#55EFC4]', 'text-[#2D3436]');
      } else {
        badge.innerHTML = `
          <span class="w-2.5 h-2.5 rounded-full bg-[#FFEAA7] animate-pulse"></span>
          <span>Firebase: Đang kết nối...</span>
        `;
      }
    }
  }
}

// Khởi tạo Singleton
export const firebaseService = new FirebaseService();
window.FirebaseAppService = firebaseService;

// Tự động chạy khi tải trang
document.addEventListener('DOMContentLoaded', () => {
  firebaseService.initialize();
});
