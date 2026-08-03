# Hostinger Node.js Backend Deployment Guide

Your backend is pre-configured with root-level redirect files (`app.js` and `server.js`) and start-up optimizations to run smoothly on Hostinger's Node.js managed hosting environment. Follow this step-by-step guide to deploy your backend.

---

## Step 1: Pre-Build TypeScript Locally
Because shared hosting servers sometimes have restricted resources (limiting compiler performance), it is best to build the TypeScript files locally and push them to Git, or build them inside your host:
1. Open a terminal in the `backend` folder locally.
2. Run:
   ```bash
   npm run build
   ```
3. This creates a `dist/` directory containing all JavaScript runtime files. Verify that this directory exists and contains `server.js`. Make sure this is pushed to your GitHub repository (which we already did).

---

## Step 2: Set Up Your Database on Supabase
Make sure your tables and schemas are created in your Supabase database:
1. Run this command locally in your `backend` folder to push the Prisma schema to Supabase:
   ```bash
   npx prisma db push
   ```
2. Check your Supabase dashboard to verify all database tables are ready.

---

## Step 3: Configure Node.js on Hostinger hPanel
1. Log in to your **Hostinger hPanel**.
2. Navigate to **Websites** and click **Manage** on your domain.
3. Look up **Node.js** in the left sidebar search bar and click it.
4. Click **Create Application** (or manage existing) and configure the settings:
   - **Application Path**: `public_html/backend` (or whichever folder you choose to upload to)
   - **Application Document Root**: `public_html/backend`
   - **Node.js Version**: Select **20.x** or **22.x** (latest LTS is recommended)
   - **Run Mode**: `production`
   - **Entry File**: **`app.js`** (Hostinger will automatically run this file, which redirects directly to `./dist/server.js`)

---

## Step 4: Upload Code to Hostinger
You can upload the files in one of two ways:

### Option A: Git Integration (Recommended)
1. In Hostinger hPanel, go to **Advanced > Git**.
2. Connect your repository URL: `https://github.com/saroj60/cvbuilder.git`.
3. Set the branch to `main`.
4. Set the directory path to `public_html/backend` and click **Create**.
5. Once created, click **Deploy**.

### Option B: File Manager (Manual Upload)
1. On your local machine, zip the `backend` folder (but **do not** include `node_modules` or `.env` files).
2. Go to **Hostinger File Manager** > `public_html/backend`.
3. Upload the `.zip` archive, right-click, and select **Extract**.

---

## Step 5: Configure Environment Variables
In your Hostinger Node.js management panel, navigate to the **Environment Variables** section and add the following keys:

| Key | Value Description | Example |
| :--- | :--- | :--- |
| `DATABASE_URL` | Supabase Transaction Pooler URI | `postgres://postgres.xxx:pass@aws-xx.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1` |
| `DIRECT_URL` | Supabase Direct URI | `postgres://postgres.xxx:pass@aws-xx.pooler.supabase.com:5432/postgres` |
| `JWT_SECRET` | Secure long random string | `your-secret-key-1234` |
| `CORS_ORIGIN` | Your production Vercel frontend URL | `https://your-app.vercel.app` |
| `NODE_ENV` | Run environment | `production` |
| `GEMINI_API_KEY` | Optional AI generator key | `AIzaSy...` |

---

## Step 6: Install Dependencies and Start Server
1. In the **Node.js** dashboard in hPanel, locate the **Console / Terminal** button or click **NPM Install**.
2. Run:
   ```bash
   npm install
   ```
3. Once installation completes, click the **Start** or **Restart** button on the Hostinger hPanel Node.js dashboard.
4. Check **`hostinger-debug.log`** in your file manager if you run into any startup problems.
