<div align="center">

  <h1>🌊 CodeWave</h1>
  <h3>Semaphore 2k26</h3>

  <p>
    <b>The Official First-Round Live Coding & Pseudocode Assessment Platform</b>
  </p>

  <p>
    <a href="#-about-codewave--semaphore-2k26"><img src="https://img.shields.io/badge/Event-CodeWave-00B4D8?style=for-the-badge&logo=codeforces&logoColor=white" alt="Event: CodeWave" /></a>
    <a href="#-about-codewave--semaphore-2k26"><img src="https://img.shields.io/badge/Fest-Semaphore_2k26-0077B6?style=for-the-badge&logo=react&logoColor=white" alt="Fest: Semaphore 2k26" /></a>
    <a href="#-about-codewave--semaphore-2k26"><img src="https://img.shields.io/badge/Theme-Aqua_Saga-03045E?style=for-the-badge&logo=waves&logoColor=white" alt="Theme: Aqua Saga" /></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white" alt="Next.js 15" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
    <img src="https://img.shields.io/badge/Prisma_ORM-2D3748?style=flat-square&logo=prisma&logoColor=white" alt="Prisma" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-38BDF8?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>

  <br />

  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" alt="Aqua Waves Divider" />

</div>

<br />

## 📖 Overview

**CodeWave** is the high-throughput, real-time assessment platform designed to power **Round 1 (MCQ & Pseudocode Quiz Round)** for the **CodeWave** event at **Semaphore 2k26: Aqua Saga**.

Built to handle high-concurrency live participant traffic, CodeWave delivers a fluid, glassmorphic UI tailored with an immersive ocean-inspired design. It equips event organizers with robust cheat-prevention, real-time analytics, automated scoring, offline resilience, and dynamic option shuffling.

---

## ✨ Key Features

### 👥 Dual-Participant Team Login
- **Team-Based Entry**: Allows two participants per team (`Participant 1 Name` & `Participant 2 Name`) during registration/login.
- **Single-Passcode Access**: Participants log in using a unique quiz passcode. Passcodes are cached in `sessionStorage` after initial login, eliminating repetitive passcode prompts.
- **Strict 1-Attempt Per Team Guard**: Ensures only one member from a registered team can take the assessment.

### 🔀 Deterministic Seeded Option Shuffling
- **Participant-Specific Shuffling**: Every participant receives a uniquely randomized option order (A, B, C, D) for every question generated using a deterministic seeded pseudo-random hash (`quizId_userId_questionId`).
- **100% Evaluation Precision**: Evaluation maps directly to `optionId` on the database level, ensuring flawless scoring accuracy regardless of display order.
- **Refresh Consistency**: Shuffled choices remain stable across browser refreshes during an active attempt.

### 💻 Multi-Language Code Snippets & Pseudocode
- Supports syntax-highlighted code evaluation questions for **JavaScript**, **TypeScript**, **Python**, **SQL / Postgres**, **Java**, **C++**, **Go**, **C**, and **Pseudocode / Algorithms**.

### 🖼️ Server-Hosted Image & Diagram Questions
- **Instant Preview**: Local blob URL preview (`URL.createObjectURL()`) for instantaneous feedback during question authoring.
- **Network-Wide Absolute URL Resolution**: Image uploads are stored locally in `/public/uploads/` and served with absolute base URLs, allowing all connected network clients to render diagrams seamlessly.

### ⚡ Parallelized High-Throughput Engine
- **Zero-Timeout Submission**: Answer updates and score calculations are parallelized via `Promise.all` and `createMany`, preventing database transaction timeouts (`P2028`) during heavy concurrent submission bursts.
- **Extended Transaction Safeguards**: Interactive transaction timeouts configured for high reliability over network database connections.

### 🛡️ Storage Recovery & Offline Resilience
- **Automated Local Storage Snapshots**: Quiz state and answer choices are continually backed up in client `localStorage`.
- **Emergency Storage Recovery Portal**: Includes a `/storage` route protected by SHA-256 passcode verification for manual recovery of participant answers in case of unexpected network drops.

### 📊 Comprehensive Admin Suite & Leaderboard
- **Live Leaderboard**: Real-time ranking with score percentages, time taken, and team statistics.
- **Quiz Management**: Create, duplicate, schedule, toggle active status, and edit sections/questions.
- **JSON Import / Export**: Bulk import quizzes and questions directly via JSON configuration.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Framework** | [Next.js 15 (App Router)](https://nextjs.org/) |
| **Language** | [TypeScript](https://www.typescriptlang.org/) |
| **Database** | [PostgreSQL](https://www.postgresql.org/) |
| **ORM** | [Prisma ORM](https://www.prisma.io/) |
| **Styling** | [Tailwind CSS](https://tailwindcss.com/) & Vanilla CSS |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Authentication** | Custom JWT Session Cookies (`jose` & `bcryptjs`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: `v18.x` or higher
- **npm** or **yarn** or **pnpm**
- **PostgreSQL Database** instance

---

### 📥 Installation & Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Shashidharak89/semaphore-coding.git
   cd semaphore-coding
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/semaphore_db?sslmode=require"
   JWT_SECRET="semaphore_mcq_quiz_jwt_secret_token_key_2026"
   COOKIE_SECURE="false"
   NEXT_PUBLIC_BASE_URL="http://localhost:3000"
   ```

4. **Initialize Database & Run Migrations**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Seed Initial Data**
   ```bash
   npm run seed
   ```

6. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```
semaphore-coding/
├── prisma/
│   ├── schema.prisma       # Database schema (User, Team, Quiz, Section, Question, Option, Attempt, Answer)
│   └── seed.ts             # Database seeder script
├── public/
│   └── uploads/            # Hosted image uploads directory
├── src/
│   ├── app/
│   │   ├── (auth)/         # Auth routes (Login & Register)
│   │   ├── (user)/         # Participant quiz routes (/quiz/[id]/take, result)
│   │   ├── admin/          # Admin portal (Quizzes, Sections, Analytics, Users, Leaderboard)
│   │   ├── api/            # Route Handlers for Auth, Admin, and User actions
│   │   └── storage/        # Storage recovery portal
│   ├── components/
│   │   ├── layout/         # Header, Navbar, ThemeToggle
│   │   └── quiz/           # QuestionCard, CodeViewer, StartAssessmentButton, Timer
│   ├── lib/
│   │   ├── auth.ts         # JWT Session & Password utilities
│   │   ├── prisma.ts       # Global Prisma client singleton
│   │   ├── storage-recovery.ts # Browser backup helper
│   │   └── services/       # Quiz, Attempt, Analytics services
└── package.json
```

---

## ⚙️ Build for Production

To create an optimized production build:

```bash
npm run build
npm start
```

---

<div align="center">

  <img src="https://user-images.githubusercontent.com/74038190/212284100-561aa473-3905-4a80-b561-0d28506553ee.gif" width="100%" alt="Aqua Waves Divider" />

  <br />

  <p>
    <b>Semaphore 2k26 • Theme: Aqua Saga</b><br />
    <i>Crafted for the CodeWave First Round MCQ & Pseudocode Challenge 🌊</i>
  </p>

</div>
