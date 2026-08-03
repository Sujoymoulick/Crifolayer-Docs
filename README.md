# 🛡️ Crifolayer Documentation Portal

This repository contains the official, production-ready documentation website for the **Crifolayer TrustLayer Platform**, styled to mirror the clean, developer-first look and feel of **GitHub Docs**.

---

## 🛠️ Technical Stack & Architecture

- **Framework**: React 19 + Vite 6 + TypeScript
- **Styling**: Tailwind CSS v4 (GitHub Slate/Zinc colors, accent blues, and responsive layouts)
- **Markdown Parsing**: `marked` with custom HTML rendering for tables and callouts
- **Code Syntax Highlighting**: `prismjs` in light/dark GitHub color-schemes
- **Routing**: Lightweight hash-based router (supports static hostings like GitHub Pages, Vercel)
- **Search Engine**: Full-text indexing modal supporting Cmd+K shortcut

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Local Development Server
```bash
npm run dev
```
The documentation portal will start locally at [http://localhost:5173](http://localhost:5173).

### 3. Compile Production Bundle
```bash
npm run build
```
This compiles the application and outputs fully-static optimized assets inside the `dist/` directory, ready for deployment.

---

## 📂 Project Organization

- `content/docs/`: Directory containing all local markdown files split by topic category.
- `src/App.tsx`: Central UI shell, managing navigation, TOC, search index, and theme toggles.
- `src/docsConfig.ts`: Sidebar layout configuration and static bundler mappings.
- `src/index.css`: Global styles, custom scrollbars, and syntax highlighter coloring.

---

## 📄 Repository Standards
- **License**: MIT License terms (see [LICENSE](LICENSE))
- **Security Policy**: Reporting guidelines (see [SECURITY.md](SECURITY.md))
- **Deployment target**: Works natively on any static server host
