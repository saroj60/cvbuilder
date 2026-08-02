# Supabase Database Deployment & Connection Guide

This guide describes how to deploy the **PostgreSQL database** for the Resume Builder backend using **Supabase**, run the database migrations, and seed initial system data.

---

## 1. Setup Supabase Project
1. Log in to [Supabase](https://supabase.com/).
2. Click **New Project** and select your organization.
3. Configure project details:
   - **Name**: `Resume Builder DB`
   - **Database Password**: *Choose a secure password and save it.*
   - **Region**: Select the closest region to your API hosting location.
4. Click **Create new project** and wait for the database service to spin up.

---

## 2. Obtain Connection Strings
Go to your Supabase Dashboard: **Project Settings** (gear icon) > **Database** > **Connection Strings**.

### A. Connection Pooling URL (For API Server)
Under the **URI** tab, toggle **Session** or **Transaction** mode. This is used by the backend API at runtime.
- **Port**: `6543`
- **Format**:
  ```env
  DATABASE_URL="postgres://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
  ```

### B. Direct Connection URL (For Prisma Migrations)
This is a direct bypass URL required by Prisma to run schema setup commands.
- **Port**: `5432`
- **Format**:
  ```env
  DIRECT_URL="postgres://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
  ```

---

## 3. Apply Schema & Seed Database

On your local development machine:

1. Configure your local `backend/.env` file with the Supabase strings:
   ```env
   DATABASE_URL="postgres://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"
   DIRECT_URL="postgres://postgres.[your-project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
   ```
2. Open terminal in the `backend` folder and run the migration command:
   ```bash
   npx prisma db push
   ```
   *This commands maps the Prisma schema directly to your Supabase PostgreSQL database without creating intermediate migration files.*

3. Start the backend in production mode to trigger auto-seeding of the default Admin user (`nepalhrsolution@gmail.com`):
   ```bash
   npm run build
   npm start
   ```
   The backend will connect to Supabase, create the database roles (if missing), and seed/verify the primary Admin user.

---

## 4. Deploying the Node/Express Server
Since Supabase runs the database but not the Express API itself:
1. Deploy your Express API codebase to a serverless/cloud provider (like **Hostinger**, **Render**, or **Railway**).
2. Configure the following environment variables in the provider's dashboard:
   - `DATABASE_URL`: *(Supabase Pooling URI)*
   - `DIRECT_URL`: *(Supabase Direct URI)*
   - `JWT_SECRET`: *(A secure random string)*
   - `CORS_ORIGIN`: `https://your-frontend.vercel.app` *(Your Vercel URL)*
   - `PORT`: `5000` *(Or let the host assign it)*
