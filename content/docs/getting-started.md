# Getting Started & Local Setup

Welcome to the official, comprehensive documentation for the **Crifolayer TrustLayer Platform**. This platform serves as a secure, decentralized identity and reputation gateway designed for B2B and B2C compliance, fraud detection, and identity verification.

---

## ⚙️ Prerequisites

Before you begin, ensure you have the following systems installed and configured on your local machine:

- **Node.js** (v18.x or later)
- **npm** (v9.x or later)
- **Supabase Account & CLI** (used for Postgres storage, database migrations, and authentication)
- **Neo4j AuraDB** (optional, but required if you want to test relationship graphs, collusion paths, and advanced fraud detection)

---

## 📂 Backend Setup

The backend serves as the core REST gateway, interfacing with Supabase, Neo4j, and identity verification engines.

1. **Clone & Navigate** to the backend directory:
   ```bash
   cd backend
   ```

2. **Configure Environment Variables** by creating a `.env` file in the root of the backend directory:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:5173

   # Supabase Credentials
   SUPABASE_URL=https://your-project-id.supabase.co
   SUPABASE_ANON_KEY=your-anon-public-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-private-key

   # Database Connection Strings (PostgreSQL)
   DATABASE_URL=postgresql://postgres:password@db.supabase.co:5432/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:password@db.supabase.co:5432/postgres

   # Neo4j Graph DB Config (Optional)
   NEO4J_URI=bolt://your-auradb-endpoint:7687
   NEO4J_USER=neo4j
   NEO4J_PASSWORD=your-auradb-password

   # Sumsub KYC integration
   SUMSUB_BASE_URL=https://api.sumsub.com
   SUMSUB_APP_TOKEN=your-sumsub-app-token
   SUMSUB_SECRET_KEY=your-sumsub-secret-key
   SUMSUB_LEVEL_NAME=id-and-liveness

   # Security secrets
   JWT_SECRET=your-jwt-signing-secret-key-2026
   SYSTEM_SALT=your-immutable-compliance-salt-2026
   ```

3. **Install Dependencies & Initialize DB**:
   Run the following commands to install packages and sync the database schema:
   ```bash
   npm install
   npx prisma db push
   ```

4. **Launch Backend Dev Server**:
   ```bash
   npm run dev
   ```
   The backend service will boot and run on `http://localhost:5000`.

---

## 💻 Frontend Setup

The frontend dashboard provides a single-page application experience built with React and Vite.

1. **Navigate** to the frontend directory:
   ```bash
   cd frontend
   ```

2. **Configure Environment Variables** by creating a `.env` file in the root of the frontend directory:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api/v1
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-public-key
   VITE_TURNSTILE_SITE_KEY=your-cloudflare-turnstile-site-key
   ```

3. **Install Dependencies & Start Dev Server**:
   ```bash
   npm install
   npm run dev
   ```
   The client application will spin up and run on `http://localhost:5173`.
