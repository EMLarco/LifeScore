<div align="center">

# LifeScore

### Gamify your habits. Level up your life.

[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat&logo=react&logoColor=white)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Mantine](https://img.shields.io/badge/Mantine-9-339AF0?style=flat&logo=mantine&logoColor=white)](https://mantine.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-20-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=flat&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

A **Progressive Web App** that transforms daily habits into an engaging RPG-like experience. Track habits, earn XP, level up, unlock achievements, compete with friends, and unlock premium features — all wrapped in a beautiful light/dark theme.

[Deploy](#deployment) | [Features](#features) | [Tech Stack](#tech-stack) | [Getting Started](#getting-started) | [API Reference](#api-reference)

</div>

---

## Screenshots

<!-- Replace these placeholders with your actual screenshots -->

| Dashboard | Habits | Store |
|:---------:|:------:|:-----:|
| ![Dashboard](https://placehold.co/800x500/1a1b2e/7c3aed?text=Dashboard) | ![Habits](https://placehold.co/800x500/1a1b2e/7c3aed?text=Habits) | ![Store](https://placehold.co/800x500/1a1b2e/7c3aed?text=Store) |

| Profile | Achievements | Challenges |
|:-------:|:------------:|:----------:|
| ![Profile](https://placehold.co/800x500/1a1b2e/7c3aed?text=Profile) | ![Achievements](https://placehold.co/800x500/1a1b2e/7c3aed?text=Achievements) | ![Challenges](https://placehold.co/800x500/1a1b2e/7c3aed?text=Challenges) |

| Agent AI | Friends | Admin Panel |
|:--------:|:-------:|:-----------:|
| ![Agent](https://placehold.co/800x500/1a1b2e/7c3aed?text=Agent+AI) | ![Friends](https://placehold.co/800x500/1a1b2e/7c3aed?text=Friends) | ![Admin](https://placehold.co/800x500/1a1b2e/7c3aed?text=Admin+Panel) |

<!-- 
HOW TO ADD YOUR SCREENSHOTS:
1. Take screenshots of your app
2. Upload them to the repo in an assets/screenshots/ folder OR use a service like imgur
3. Replace the placeholder URLs above with your actual image paths, e.g.:
   ![Dashboard](./assets/screenshots/dashboard.png)
-->

---

## Features

### Core Gamification
- **Habit Tracking** — Create, edit, delete, and reorder habits with drag-and-drop
- **XP & Leveling System** — Earn experience points for completing habits; level up with increasing thresholds
- **Daily Streaks** — Maintain consecutive-day streaks for bonus XP multipliers
- **365 Achievements** — Unlock badges for milestones (streaks, completions, special actions)

### Social & Competition
- **Friends System** — Add friends, view their profiles and progress
- **Friend Challenges** — Create 1v1 habit challenges with deadlines and XP stakes
- **Ranking** — Global and friends-only leaderboards
- **Premium Challenges** — Monthly competitive challenges with exclusive rewards

### AI-Powered
- **AI Agent Chat** — Natural language assistant powered by OpenRouter (GPT-4o-mini) for habit advice, motivational tips, and analytics

### Monetization
- **Points Store** — Purchase avatars, banners, skins, and special effects with earned or bought points
- **PayPal Integration** — Buy points or activate premium membership via PayPal
- **Premium Membership** — $9.99/mo or $89.99/yr for exclusive features, challenges, and custom themes

### Security & Auth
- **Google OAuth** — One-click sign-in with Google accounts
- **Two-Factor Authentication (2FA)** — TOTP-based 2FA with QR code setup and email codes
- **JWT Sessions** — Secure token-based authentication with session management
- **Audit Logging** — Complete audit trail of all financial and user actions

### Admin
- **Admin Panel** — Dashboard with user stats, revenue metrics, habit analytics
- **PDF Audit Export** — Generate comprehensive system audit reports
- **User Management** — View, edit, and manage all platform users

### UX & Design
- **PWA (Offline-First)** — Installable, works offline with background sync
- **Light & Dark Themes** — Beautiful, consistent theming with CSS variables
- **Push Notifications** — Browser notifications for reminders and achievements
- **Responsive Design** — Works seamlessly on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Mantine UI 9, Vite 8, React Router 7, Recharts, pdfmake |
| **Backend** | Node.js, Express 4, PostgreSQL (via pg), JSON Web Tokens |
| **AI** | OpenRouter API (GPT-4o-mini) |
| **Auth** | JWT, Google OAuth 2.0, TOTP 2FA (speakeasy + qrcode) |
| **Payments** | PayPal Orders API (sandbox) |
| **Notifications** | Web Push (VAPID), Nodemailer (SMTP) |
| **PWA** | Workbox, Service Workers, Vite PWA Plugin |
| **Testing** | Vitest, React Testing Library, Jest DOM |
| **Deployment** | Vercel (Frontend), Render (Backend), PostgreSQL (Neon/Render) |

---

## Project Structure

```
lifescore/
├── frontend/                  # React PWA (Vite)
│   ├── public/                # Static assets (icons, manifest, SW)
│   ├── src/
│   │   ├── api/               # Axios config & interceptors
│   │   ├── components/        # Reusable UI components
│   │   │   ├── layout/        # Navbar, Sidebar, Footer
│   │   │   ├── habits/        # HabitCard, HeatMap, LevelProgress
│   │   │   ├── challenges/    # DailyChallenges, ChallengesList
│   │   │   ├── friends/       # FriendChallenges
│   │   │   └── common/        # ErrorMessage, DailyLoginButton
│   │   ├── context/           # AuthContext, ThemeContext
│   │   ├── hooks/             # useAuth, useLocalStorage
│   │   ├── pages/             # All page-level views (20+)
│   │   ├── services/          # API service modules
│   │   └── utils/             # PDF generator, formatters
│   ├── vercel.json            # Vercel SPA routing config
│   └── package.json
│
├── backend/                   # Express API
│   ├── src/
│   │   ├── config/            # Database, JWT, push config
│   │   ├── controllers/       # 15+ route controllers
│   │   ├── database/          # SQL migrations (001-022)
│   │   ├── middlewares/       # Auth, error handling, logging
│   │   ├── models/            # User, Habit, HabitLog, Achievement
│   │   ├── routes/            # 20+ route modules
│   │   ├── services/          # Email, AI agent, audit, payments
│   │   └── utils/             # JWT helpers, crypto helpers
│   ├── tests/                 # Unit tests (129+ passing)
│   └── package.json
│
└── README.md
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/EMLarco/LifeScore.git
cd LifeScore
```

### 2. Backend setup

```bash
cd backend
cp .env.example .env          # Fill in your environment variables
npm install
npm run dev                    # Starts on http://localhost:5000
```

### 3. Database setup

Create the PostgreSQL database and run migrations:

```sql
CREATE DATABASE lifescore_db;
CREATE USER lifescore_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE lifescore_db TO lifescore_user;
```

Then run each migration file in `backend/src/database/migrations/` in order via pgAdmin or psql.

### 4. Frontend setup

```bash
cd frontend
cp .env.example .env          # Set VITE_API_URL=http://localhost:5000/api
npm install
npm run dev                    # Starts on http://localhost:5173
```

### 5. Run tests

```bash
# Backend (129 tests)
cd backend && npm test

# Frontend (6 tests)
cd frontend && npm test
```

---

## Deployment

### Frontend — Vercel

1. Push your code to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import the `EMLarco/LifeScore` repository
4. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
5. Add environment variables:
   - `VITE_API_URL` = Your backend URL + `/api`
   - `VITE_VAPID_PUBLIC_KEY` = Your VAPID public key
6. Deploy

### Backend — Render

1. Go to [render.com](https://render.com) and create a new **Web Service**
2. Connect your GitHub repository
3. Configure:
   - **Root Directory**: `backend`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add all environment variables from `backend/.env.example` (use production values)
5. Create a **PostgreSQL** database on Render and connect it
6. Deploy

### Database — Neon (Recommended for free tier)

1. Create a free account at [neon.tech](https://neon.tech)
2. Create a new project and copy the connection string
3. Use it as your `DB_HOST` in the backend environment variables

---

## Environment Variables

<details>
<summary>Backend (.env)</summary>

| Variable | Description | Example |
|----------|-------------|---------|
| `PORT` | Server port | `5000` |
| `DB_HOST` | PostgreSQL host | `localhost` |
| `DB_PORT` | PostgreSQL port | `5432` |
| `DB_NAME` | Database name | `lifescore_db` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | `your_password` |
| `JWT_SECRET` | JWT signing secret | `your_secret` |
| `JWT_EXPIRES_IN` | Token expiration | `7d` |
| `VAPID_PUBLIC_KEY` | Web Push public key | `BA...` |
| `VAPID_PRIVATE_KEY` | Web Push private key | `abc...` |
| `OPENROUTER_API_KEY` | OpenRouter API key | `sk-or-v1-...` |
| `OPENROUTER_MODEL` | AI model | `openai/gpt-4o-mini` |
| `PAYPAL_CLIENT_ID` | PayPal client ID | `AU...` |
| `PAYPAL_CLIENT_SECRET` | PayPal secret | `EI...` |
| `PAYPAL_BASE_URL` | PayPal API URL | `https://api-m.sandbox.paypal.com` |
| `FRONTEND_URL` | Frontend URL | `https://your-app.vercel.app` |
| `BACKEND_URL` | Backend URL | `https://your-app.onrender.com` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID | `217...` |
| `GOOGLE_CLIENT_SECRET` | Google OAuth secret | `GOC...` |
| `SMTP_HOST` | Email server host | `smtp.gmail.com` |
| `SMTP_USER` | Email address | `you@gmail.com` |
| `SMTP_PASSWORD` | Email app password | `xxxx` |
| `TOTP_SECRET` | 2FA TOTP secret | `your_secret` |

</details>

<details>
<summary>Frontend (.env)</summary>

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API base URL | `https://your-app.onrender.com/api` |
| `VITE_VAPID_PUBLIC_KEY` | Web Push public key | `BA...` |

</details>

---

## API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/auth/register` | POST | Register new user |
| `/api/auth/login` | POST | Login with email/password |
| `/api/auth/google` | GET | Google OAuth login |
| `/api/habits` | GET/POST | List or create habits |
| `/api/habits/:id` | PUT/DELETE | Update or delete habit |
| `/api/habits/:id/complete` | POST | Complete a habit (earn XP) |
| `/api/gamification/stats` | GET | User level, XP, achievements |
| `/api/challenges` | GET/POST | Daily, weekly, monthly challenges |
| `/api/friends` | GET/POST | Manage friends list |
| `/api/friend-challenges` | GET/POST | Create friend challenges |
| `/api/ranking` | GET | Global & friends leaderboard |
| `/api/store` | GET | Available items (skins, banners) |
| `/api/payment` | POST | PayPal payment flows |
| `/api/profile` | PUT | Update profile |
| `/api/profile/avatar` | POST | Upload avatar image |
| `/api/admin` | GET | Admin dashboard data |
| `/api/agent` | POST | AI chat assistant |
| `/api/sessions` | GET | Active user sessions |
| `/api/2fa` | POST | Enable/disable 2FA |
| `/api/health` | GET | Health check |

---

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with passion for better habits**

[![GitHub](https://img.shields.io/badge/GitHub-EMLarco-181717?style=flat&logo=github)](https://github.com/EMLarco)

</div>
