# LIGHTHOUSE - GitHub Repository Analyzer

AI-powered GitHub repository analysis and onboarding guide generator.

## Sprint 1 - Foundation Complete ✅

This is the Sprint 1 foundation deliverable with complete backend and frontend infrastructure.

## Project Structure

```
lighthouse/
├── backend/          # Node.js + TypeScript + Express + Prisma backend
└── frontend/         # Next.js 14 + React + TailwindCSS frontend
```

## Quick Start

### Backend
```bash
cd backend
npm install
cp .env.example .env
docker-compose up -d
npm run dev
```

### Frontend
```bash
cd frontend
npm install
cp .env.local.example .env.local
npm run dev
```

Access:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- Health Check: http://localhost:3001/api/v1/health

## Sprint 1 Deliverables ✅

All Sprint 1 requirements completed:
- ✅ Backend project setup with TypeScript
- ✅ Docker Compose (PostgreSQL + Redis)
- ✅ Express API with middleware
- ✅ Prisma schema and database config
- ✅ Health check endpoint
- ✅ Frontend Next.js 14 setup
- ✅ TailwindCSS configuration
- ✅ UI component library
- ✅ Zustand state management
- ✅ API client layer
- ✅ Both projects compile successfully

See full documentation in individual project folders.
