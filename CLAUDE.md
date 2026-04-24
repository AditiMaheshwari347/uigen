# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Code Style

Use comments sparingly — only on code complex enough that its intent isn't clear from reading it.

## Commands

```bash
# First-time setup
npm run setup          # installs deps, generates Prisma client, runs migrations

# Development
npm run dev            # starts Next.js with Turbopack (requires NODE_OPTIONS shim via node-compat.cjs)
npm run dev:daemon     # same but backgrounded, logs to logs.txt

# Testing
npm test               # runs Vitest
npm test -- --run src/path/to/test.ts   # run a single test file

# Database
npm run db:reset       # drops and recreates the SQLite dev.db

# Lint / build
npm run lint
npm run build
```

Prisma client is generated to `src/generated/prisma/` (not the default `node_modules` location). After any schema change run `npx prisma generate && npx prisma migrate dev`.

## Architecture

### Request flow

A user message → `POST /api/chat` (`src/app/api/chat/route.ts`) → Vercel AI SDK `streamText` → Claude (or mock) with two tools → streamed tool calls are intercepted on the client by `ChatContext` → `FileSystemContext.handleToolCall` mutates the in-memory `VirtualFileSystem` → `PreviewFrame` re-renders the iframe.

### Virtual File System

`src/lib/file-system.ts` — `VirtualFileSystem` is an in-memory tree; nothing is written to disk. Files are serialised to `Record<string, FileNode>` for transport (chat API body, project persistence in SQLite). The client holds the canonical copy; the server reconstructs a temporary instance per request.

Entry-point discovery order for preview: `/App.jsx` → `/App.tsx` → `/index.jsx` → `/index.tsx` → `/src/App.jsx` → `/src/App.tsx` → first `.jsx`/`.tsx` found.

### AI tools (server-side)

- `str_replace_editor` (`src/lib/tools/str-replace.ts`) — `create`, `str_replace`, `insert`, `view` commands on the VFS.
- `file_manager` (`src/lib/tools/file-manager.ts`) — `rename`, `delete` commands.

Both tools operate on a `VirtualFileSystem` instance that is reconstructed from the serialised files sent in the request body.

### Preview pipeline

`src/lib/transform/jsx-transformer.ts`:
1. `transformJSX` — Babel standalone transpiles JSX/TSX → JS, strips CSS imports.
2. `createImportMap` — for each file, creates a blob URL; third-party packages are resolved via `https://esm.sh/`; missing local imports get placeholder stub modules.
3. `createPreviewHTML` — builds a full HTML document with an ES module import map, injects Tailwind CDN, and renders the app via `ReactDOM.createRoot` inside an error boundary.

The iframe uses `sandbox="allow-scripts allow-same-origin allow-forms"` so blob URLs in the import map work.

### State management (client)

Two React contexts wrap the whole UI:

- `FileSystemContext` (`src/lib/contexts/file-system-context.tsx`) — owns the `VirtualFileSystem` instance and exposes CRUD helpers plus `handleToolCall` (dispatches streaming tool calls into VFS mutations).
- `ChatContext` (`src/lib/contexts/chat-context.tsx`) — wraps Vercel AI SDK `useChat`, passes serialised VFS in the request body, forwards `onToolCall` to `FileSystemContext.handleToolCall`.

### Auth

JWT stored in an httpOnly cookie (`auth-token`), 7-day expiry. `src/lib/auth.ts` (server-only) issues/reads sessions. Middleware (`src/middleware.ts`) protects `/api/projects` and `/api/filesystem`. `/api/chat` is public; project saving within that route is skipped if no session exists.

Anonymous users' work is tracked in `sessionStorage` via `src/lib/anon-work-tracker.ts` so it can be migrated on sign-up.

### Mock provider

If `ANTHROPIC_API_KEY` is absent, `getLanguageModel()` (`src/lib/provider.ts`) returns `MockLanguageModel`, which streams static counter/form/card component code without calling any LLM. The real model is `claude-haiku-4-5`.

### Database

Prisma + SQLite (`prisma/dev.db`). Two models: `User` (email/password) and `Project` (stores `messages` and `data` as JSON strings). Generated client lives in `src/generated/prisma/`.

The schema is the source of truth for all data structures — reference `prisma/schema.prisma` whenever you need to understand what is stored in the database.
