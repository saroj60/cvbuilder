# Production-Ready AI Recruitment Resume Management System

A full-stack, enterprise-grade AI Recruitment and Resume Management application built using **Clean Architecture** principles.

---

## 🛠️ Tech Stack & Architecture

### Backend (`/backend`)
- **Runtime**: Node.js
- **Framework**: Express.js with TypeScript
- **Database & ORM**: PostgreSQL with Prisma ORM
- **Authentication**: JWT (JSON Web Tokens) with bcrypt password hashing
- **Security & Reliability**: Helmet, CORS, Express Rate Limiting, Zod Request Validation
- **Architecture**: Controller-Service-Repository (Clean Layered Architecture)

### Frontend (`/frontend`)
- **Framework**: React 18 + Vite + TypeScript
- **Styling**: Tailwind CSS + ShadCN UI design principles + Dark/Light Theme support
- **State & Data Fetching**: React Query (TanStack Query) + Axios with automatic JWT interceptors
- **Form Management**: React Hook Form + Zod Schema Validation
- **Routing & Common UI**: React Router v6, Toast Notifications, Error Boundaries, 404 Pages

---

## 📁 Directory Structure

```text
Resume Builder/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          # PostgreSQL Schema (User, Job, Resume)
│   ├── src/
│   │   ├── config/                # Environment variables & Prisma instance
│   │   ├── controllers/           # HTTP Request Controllers
│   │   ├── middlewares/           # Auth, Zod Validation, Error Handlers
│   │   ├── routes/                # Express API Route declarations
│   │   ├── services/              # Business logic & AI scoring service
│   │   ├── utils/                 # JWT helper & Response utilities
│   │   ├── app.ts                 # Express Middleware & Server setup
│   │   └── server.ts              # Server bootstrapper & DB connector
│   ├── .env.example
│   ├── package.json
│   └── tsconfig.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── common/            # ErrorBoundary, NotFoundPage
    │   │   ├── layout/            # Navbar, Sidebar, Main Layout
    │   │   └── ui/                # ShadCN Button, Card, Input, Badge, Toast, Loader
    │   ├── context/               # AuthContext, ThemeContext
    │   ├── lib/                   # Axios instance, Zod schemas, Utility helpers
    │   ├── pages/                 # Dashboard, Resumes, ResumeDetail, Jobs, Auth Pages
    │   ├── routes/                # Protected/Public Routes
    │   ├── services/              # Typed API calls for React Query
    │   ├── types/                 # TypeScript interfaces
    │   ├── App.tsx
    │   └── main.tsx
    ├── .env.example
    ├── package.json
    ├── tailwind.config.js
    └── vite.config.ts
```

---

## 🚀 Quick Setup & Getting Started

### 1. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
# Copy .env.example to .env and adjust PostgreSQL database credentials
cp .env.example .env

# Generate Prisma Client & Run Database Migrations
npx prisma generate
npx prisma migrate dev --name init

# Start the Backend Server (Development mode)
npm run dev
```
Backend will run at `http://localhost:5000`.

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start the Vite React Development Server
npm run dev
```
Frontend will run at `http://localhost:5173`.

---

## ✨ Features

1. **AI Resume Keyword & Candidate Screening**:
   - Automated candidate qualification scoring (%) based on matching skills against job posting requirements.
   - Intelligent status recommendation (`SHORTLISTED`, `PENDING`, `REJECTED`).
2. **Dashboard Analytics**:
   - Live metrics summary: candidate pipeline count, shortlist numbers, interview stage, average match rate.
3. **Interactive Candidate Management**:
   - Filter resumes by status stage or search candidates by skill set.
   - Detailed candidate profile view with status transition dropdowns.
4. **Job Opening Creation**:
   - Create custom job postings with target skill requirements for scoring candidates.
5. **Theme Support**:
   - Dark/Light mode toggle with persistence.
