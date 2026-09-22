# NSS Recruitment Online Test Portal

This repository contains the complete implementation across **Phases 1, 2, 3 & 4** of the National Service Scheme (NSS) Recruitment Online Test Portal.

## 🚀 Tech Stack

- **Frontend**: React 19 + Vite 8 + Tailwind CSS + Lucide Icons + Axios + React Router
- **Backend**: Node.js + Express.js + Helmet + express-rate-limit
- **Database**: MongoDB Atlas (or local MongoDB) via Mongoose
- **Authentication**: JWT stored in **HTTP-only Cookies** + Passwords hashed with **bcryptjs**
- **Exam Engine**: Server-side timer, randomized 15 MCQs + 5 Subjective questions (Total = 20), atomic answer persistence, and backend MCQ scoring.
- **Strict Anti-Cheat Engine**: Zero-tolerance browser-level violation detection, atomic session termination (`IN_PROGRESS` → `TERMINATED`), event deduplication, background heartbeat, student watermark, and immediate lockout.
- **Session & Backend Security**: Cryptographic 32-byte session token hashing (`sessionTokenHash`), atomic status guards, rate limiting, request body limits (`10kb`), generic authentication errors (anti-enumeration), input validation, and server audit logging.

---

## 📁 Directory Structure

```
NSS/
├── client/                               # Frontend (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js                 # Axios instance with credentials & x-session-token interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx           # Auth state, session check, login & logout
│   │   ├── hooks/
│   │   │   └── useExamAntiCheat.js       # Centralized browser anti-cheating event hook
│   │   ├── components/
│   │   │   ├── Navbar.jsx                # Header with branding, user info & navigation
│   │   │   └── ProtectedRoute.jsx        # Route guards for Student & Admin
│   │   ├── pages/
│   │   │   ├── Home.jsx                  # Portal landing page
│   │   │   ├── StudentLogin.jsx          # Roll Number + Password login
│   │   │   ├── StudentRegister.jsx       # Candidate registration
│   │   │   ├── AdminLogin.jsx            # Admin Username + Password login
│   │   │   ├── StudentDashboard.jsx      # Available exam card, profile, stage status
│   │   │   ├── ExamInstructions.jsx      # Guidelines & fullscreen entry enforcement
│   │   │   ├── ExamPage.jsx              # Responsive test UI, watermark, timer, palette
│   │   │   ├── ExamTerminated.jsx        # Lockout screen with reason of violation
│   │   │   ├── ExamResult.jsx            # Official result (MCQ score + Subjective pending)
│   │   │   ├── AdminDashboard.jsx        # Metrics & Candidate directory
│   │   │   ├── AdminExams.jsx            # Exam CRUD & Active status toggle
│   │   │   └── AdminQuestions.jsx        # Question CRUD (MCQ options A-D, subjective points)
│   │   ├── App.jsx                       # Client route definitions
│   │   ├── main.jsx                      # App bootstrap
│   │   └── index.css                     # Tailwind CSS, print shield & selection disable
│   ├── package.json
│   └── vite.config.js                    # Vite config with API proxy
├── server/                               # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/
│   │   │   └── db.js                     # MongoDB connection (supports MONGODB_URI / MONGO_URI)
│   │   ├── models/
│   │   │   ├── Student.js                # Student schema (rollNumber, name, branch, year)
│   │   │   ├── Admin.js                  # Admin schema (username, password)
│   │   │   ├── Exam.js                   # Exam schema (title, duration, totalMarks, isActive)
│   │   │   ├── Question.js               # Question schema (MCQ / Subjective, options, answers)
│   │   │   ├── ExamSession.js            # ExamSession (status, assignedQuestions, sessionTokenHash)
│   │   │   ├── Answer.js                 # Answer schema (sessionId, questionId, answer, savedAt)
│   │   │   └── Violation.js              # Anti-cheat violation log schema
│   │   ├── middleware/
│   │   │   ├── auth.js                   # JWT verification & role authorization (Student/Admin)
│   │   │   ├── validator.js              # Input validation (login, register, answers, exams, questions)
│   │   │   └── errorHandler.js           # Centralized sanitized error handler & audit logger
│   │   ├── controllers/
│   │   │   ├── authController.js         # Authentication logic (generic error messages)
│   │   │   ├── studentController.js      # Student dashboard profile data
│   │   │   ├── adminController.js        # Admin metrics and candidate directory
│   │   │   ├── examController.js         # Student exam flow, session security, atomic submit
│   │   │   └── adminExamController.js    # Admin exams & questions CRUD
│   │   ├── routes/
│   │   │   ├── authRoutes.js             # /api/auth
│   │   │   ├── studentRoutes.js          # /api/student
│   │   │   ├── adminRoutes.js            # /api/admin (students, exams, questions)
│   │   │   └── examRoutes.js             # /api/exam (start, questions, answer, violation, heartbeat)
│   │   ├── utils/
│   │   │   └── securityLogger.js         # Server audit logger for security anomalies
│   │   ├── scripts/
│   │   │   ├── seed.js                   # Populates demo users and full 20-question exam
│   │   │   ├── testModelsAndAuth.js      # Phase 1 unit test
│   │   │   ├── testPhase2ExamFlow.js     # Phase 2 unit test
│   │   │   ├── testAntiCheat.js          # Phase 3 anti-cheat unit test
│   │   │   └── testSecurity.js           # Phase 4 security invariants (all 24 checks)
│   │   └── server.js                     # Express app with Helmet, Rate-Limit, CORS
│   ├── .env.example                      # Environment variables template
│   └── package.json
├── .gitignore                            # Git ignore (.env, node_modules, dist)
├── .env.example
└── README.md
```

---

## 🔑 Default Seed Credentials

After running `npm run seed` in `server/`, you can use these accounts to test:

### 1. Administrator Account
- **Username**: `admin`
- **Password**: `AdminPassword123`

### 2. Candidate Account
- **Roll Number**: `2024NSS001`
- **Password**: `StudentPassword123`
- **Name**: `Rahul Sharma`
- *(Or click **"Register New Candidate"** on the portal)*

---

## ⚙️ Environment Variables

Create a `.env` file inside `server/` (or copy from `server/.env.example`):

```env
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/nss_recruitment?retryWrites=true&w=majority
JWT_SECRET=nss_recruitment_jwt_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

---

## 🛠️ Installation & Setup Instructions

### Prerequisites
- Node.js (v18+)
- MongoDB Atlas cluster (or local MongoDB running)

### Step 1: Install Backend Dependencies & Seed
```bash
cd server
npm install
npm run seed
```

### Step 2: Start the Backend Server
```bash
npm run dev
# Running on http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Step 3: Install Frontend Dependencies & Start Client
Open a new terminal window:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

---

## 🧪 Automated Testing

Run verification suites directly from `server/`:

```bash
cd server

# Verify Phase 1 Auth & Models:
npm run test:auth

# Verify Phase 2 Exam Randomization, Security & Scoring:
npm run test:exam

# Verify Phase 3 Strict Browser-Level Anti-Cheating:
npm run test:anticheat

# Verify Phase 4 Backend, Session & Answer Security (All 24 Tests):
npm run test:security
```

---

## 📡 API Endpoints Reference

### Student Exam Routes (`/api/exam`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| `GET` | `/api/exam/active` | Student | Get active exam overview and candidate's session status |
| `POST` | `/api/exam/:examId/start` | Student | Start exam (samples 15 MCQs + 5 Subjectives, shuffles options, sets server timer) |
| `GET` | `/api/exam/session` | Student | Get session metadata and expiry check |
| `GET` | `/api/exam/session/questions` | Student | Get sanitized questions (no correct answers) & saved answers |
| `POST` | `/api/exam/session/answer` | Student | Save/update an answer (atomic upsert; verifies timer expiry & rejects terminated sessions) |
| `POST` | `/api/exam/session/violation` | Student | Record violation, atomically set `status: TERMINATED`, log Violation entry |
| `POST` | `/api/exam/session/heartbeat` | Student | Keepalive pulse every 10s (updates `lastSeenAt`; does NOT alter timer) |
| `POST` | `/api/exam/session/submit` | Student | Submit exam (calculates MCQ score on backend, marks COMPLETED) |
| `GET` | `/api/exam/session/result` | Student | Get official result (MCQ score + Subjective pending) |

---

## 🛡️ Phase 3: Strict Anti-Cheating System

The exam portal enforces a strict, **zero-tolerance** anti-cheating policy:

1. **No Warnings**: Any detected violation terminates the exam immediately.
2. **Atomic Session Termination**: The backend transitions `status` from `IN_PROGRESS` → `TERMINATED`. Once terminated, no further answers or submission attempts can ever succeed.
3. **Violation Logging**: Every incident is stored in the `Violation` collection with `studentId`, `examId`, `sessionId`, `type`, `timestamp`, and `metadata`.
4. **Deduplication**: A client-side ref (`terminationInProgress`) ensures multiple event triggers do not spam duplicate violation requests.
5. **Session Lockout**: Terminated candidates are redirected to `/exam/terminated` with the explicit reason and cannot resume, restart, or re-enter the exam.
6. **Student Watermark**: A subtle repeating watermark (`Name • RollNumber • NSS-2026`) is displayed across the exam viewport for identity audit without obscuring question readability.
7. **Heartbeat Monitoring**: The client pulses `/api/exam/session/heartbeat` every 10 seconds. The server tracks `lastSeenAt` without affecting timer expiry.

### Detected Prohibited Actions:
- **TAB_SWITCH**: Tab hidden or switched via Page Visibility API (`visibilitychange`).
- **WINDOW_BLUR**: Window focus lost (`window.blur`).
- **FULLSCREEN_EXIT**: Fullscreen exited (`fullscreenchange` when `fullscreenElement === null`).
- **COPY_ATTEMPT / PASTE_ATTEMPT / CUT_ATTEMPT**: Clipboard copy, cut, or paste attempts (`copy`, `paste`, `cut`).
- **RIGHT_CLICK**: Right-click context menu attempts (`contextmenu`).
- **TEXT_SELECTION**: Question text selection (`selectstart`, CSS `user-select: none`).
- **RESTRICTED_SHORTCUT**: Developer tools or navigation shortcuts (`Ctrl+C`, `Ctrl+V`, `Ctrl+X`, `Ctrl+U`, `Ctrl+Shift+I`, `Ctrl+Shift+J`, `Ctrl+Shift+C`, `F12`).
- **PRINT_ATTEMPT / SAVE_ATTEMPT**: Print or page save attempts (`Ctrl+P`, `beforeprint`, `PrintScreen`, `Ctrl+S`, `@media print`).
- **MULTIPLE_SESSION**: Concurrent login/session attempts on multiple tabs or devices.

---

## ⚠️ Important Browser Limitations

A standard web browser cannot guarantee 100% prevention or detection of:
- **Physical screenshots / external capture devices**: Photographing the screen with a mobile phone or hardware video capture cards.
- **Physical secondary devices**: Looking up answers on a secondary phone, tablet, or another computer.
- **OS-level global shortcuts**: System shortcuts intercepted by the operating system before reaching the browser viewport.
- **OS-level application switching**: Certain virtual desktops or window arrangements that do not trigger browser blur/visibility events.
- **Browser/OS exploits**: Tampering with lower-level browser processes outside standard DOM sandbox control.

The application implements the strongest reasonable browser-level detection, immediate termination, and audit logging, but does not make unrealistic claims of absolute hardware-level cheating prevention.

