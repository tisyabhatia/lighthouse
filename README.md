# LIGHTHOUSE - GitHub Repository Analyzer

AI-powered GitHub repository analysis and onboarding guide generator.

# Startup

## Prerequisites (One-time setup)
- [ ] Docker Desktop installed and set to start on Windows login
- [ ] Node.js installed
- [ ] Backend `.env` file created (copy from `.env.example`)

---

## Daily Startup Steps

**Step 1: Start Docker Desktop**
- Open Docker Desktop from Start Menu
- Wait for whale icon to stop animating (1-2 min)

**Step 2: Start Database Containers**
```powershell
cd C:\Users\bhati\OneDrive\University of Washington\lighthouse\backend
docker compose up -d
```

**Step 3: Verify Containers Running**
```powershell
docker ps
```
You should see `lighthouse-postgres` and `lighthouse-redis` both "healthy"

**Step 4: Start Backend (Terminal 1)**
```powershell
cd backend
npm run dev
```
Wait for: `🚀 Server started successfully` and `🌐 Port: 3001`

**Step 5: Start Frontend (Terminal 2 - new window)**
```powershell
cd C:\Users\bhati\OneDrive\University of Washington\lighthouse\frontend
npm run dev
```
Wait for: `✓ Ready`

**Step 6: Open in Browser**
- Frontend: http://localhost:3000
- Backend health check: http://localhost:3001/api/v1/health

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "docker: error during connect" | Open Docker Desktop and wait for it to start |
| Backend hangs after Redis connects | Run `npx prisma db push` then `npm run dev` |
| Port 3000 in use | Stop other terminals, or frontend will use 3001 |
| Database connection errors | Run `docker compose up -d` first |

---

## Shutdown Steps
1. Ctrl+C in both terminals
2. (Optional) Stop Docker containers: `docker-compose down`
