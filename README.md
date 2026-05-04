# Heron Dictionary

A self-hosted, Study-Tech-informed dictionary web app built with Preact, Express, and SQLite. Every word entry includes three definition levels (Basic / Standard / Advanced), example sentences, usage examples, etymology, synonyms, idioms, and a Study-Tech reminder prompt. The admin panel lets you manage words, fetch drafts from English Wiktionary, and bulk-import via JSON.

---

## Features

- **Three-level definitions** — Basic (plain language), Standard (dictionary-grade), Advanced (full nuance, technical context). Sourced from English Wiktionary as a starting point.
- **Study-Tech methodology** — Each word view prompts you to use the word in your own sentence before moving on, following Hubbard's word-clearing methodology.
- **10 built-in themes** + custom theme editor — Ported from the DelphiNet6 CSS-variable theme system. Switch themes from any page header. Create, edit, and persist custom themes in `localStorage`.
- **Admin panel** — Password-protected UI to add/edit/delete words, fetch Wiktionary drafts, and bulk-import from JSON.
- **Self-contained** — Single `docker compose up` command. No external database; SQLite is stored in a named Docker volume.

---

## Quick Start

### Requirements

- Docker + Docker Compose (or Docker Desktop)

### Run

```bash
git clone https://github.com/youruser/Heron-Dictionary.git
cd Heron-Dictionary
docker compose up -d --build
```

The app will be available at **http://localhost:8089**.

> **First run:** The backend seeds the database with a few example words automatically. The frontend waits for the backend healthcheck to pass before starting.

### Default credentials

| Setting         | Default value  |
|-----------------|----------------|
| Admin password  | `heron-admin`  |
| Admin URL       | `/admin`       |
| API port        | `3001` (internal) |
| Public port     | `8089`         |

---

## Configuration

All backend settings are environment variables set in `docker-compose.yml`:

| Variable         | Default         | Description                                        |
|------------------|-----------------|----------------------------------------------------|
| `PORT`           | `3001`          | Port the Express API listens on                    |
| `DATA_DIR`       | `/data`         | Directory where `heron.db` (SQLite) is stored      |
| `ADMIN_ENABLED`  | `true`          | Set to `false` to disable all `/api/admin/*` routes|
| `ADMIN_PASSWORD` | `heron-admin`   | Password for the admin panel — **change this**     |

To change the password, edit `docker-compose.yml` before building:

```yaml
environment:
  ADMIN_PASSWORD: "your-strong-password-here"
```

To change the public port from 8089:

```yaml
ports:
  - "YOUR_PORT:80"
```

---

## Project Structure

```
Heron-Dictionary/
├── docker-compose.yml          # Two-service stack (backend + frontend)
├── Study-Tech/                 # Reference material for the word-clearing methodology
│
├── backend/
│   ├── Dockerfile              # Single-stage Node.js build (compile → prune devDeps)
│   ├── .dockerignore
│   ├── package.json
│   ├── tsconfig.json
│   ├── data/
│   │   └── seed.json           # Initial words loaded when DB is empty
│   └── src/
│       ├── index.ts            # Express app entry point, seeding logic
│       ├── db.ts               # better-sqlite3 setup, schema migrations
│       ├── wiktionary.ts       # Wiktionary REST API fetch + parse
│       └── routes/
│           ├── words.ts        # Public word search + lookup
│           └── admin.ts        # Admin CRUD + import + Wiktionary fetch
│
└── frontend/
    ├── Dockerfile              # Two-stage: Node build → nginx:alpine
    ├── nginx.conf              # SPA routing + /api proxy to backend
    ├── .dockerignore
    ├── package.json
    ├── tailwind.config.js      # Semantic classes mapped to CSS variables
    ├── vite.config.ts
    └── src/
        ├── main.tsx            # Entry point, ThemeProvider wrapper
        ├── app.tsx             # Preact Router routes
        ├── index.css           # All 10 theme CSS variable blocks + global styles
        ├── api/
        │   └── client.ts       # Typed fetch wrappers for all API endpoints
        ├── types/
        │   └── dictionary.ts   # TypeScript interfaces (WordEntry, Definition, etc.)
        ├── lib/
        │   └── themes.ts       # Theme catalogue, applyTheme(), token types
        ├── contexts/
        │   └── ThemeContext.tsx # Theme state, localStorage persistence, custom CRUD
        ├── components/
        │   ├── layout/
        │   │   └── Layout.tsx
        │   └── ui/
        │       ├── Button.tsx
        │       ├── Card.tsx
        │       ├── ThemeSelector.tsx   # Dropdown with color swatches
        │       └── ThemeEditor.tsx     # Modal color-picker for custom themes
        └── pages/
            ├── DictionaryPage.tsx      # Main lookup page
            ├── components/
            │   ├── WordSearch.tsx      # Debounced search input + autocomplete
            │   ├── WordEntry.tsx       # Full word view container
            │   ├── DefinitionCard.tsx  # Definition + sentences + examples
            │   ├── LevelSelector.tsx   # Basic / Standard / Advanced dropdown
            │   ├── EtymologyBlock.tsx
            │   ├── SynonymsBar.tsx
            │   └── IdiomsList.tsx
            └── admin/
                ├── AdminPage.tsx       # Admin router (login → layout → sub-pages)
                ├── AdminLayout.tsx     # Sidebar nav + header with ThemeSelector
                ├── AdminLogin.tsx
                ├── AdminDashboard.tsx  # Word list + stats
                ├── WordEditor.tsx      # Create/edit word with all three levels
                └── ImportPanel.tsx     # Wiktionary fetch + JSON upload
```

---

## API Reference

### Public endpoints

| Method | Path                  | Description                                         |
|--------|-----------------------|-----------------------------------------------------|
| `GET`  | `/_health`            | Health check — returns `{ status: "ok", ts: N }`   |
| `GET`  | `/api/words`          | List all words (no query) or prefix-search (`?q=`)  |
| `GET`  | `/api/words/:word`    | Full word entry with all definitions (case-insensitive) |

**Search example:**
```
GET /api/words?q=def
→ [{ id, word, part_of_speech }, ...]
```

**Word lookup example:**
```
GET /api/words/define
→ {
    id, word, part_of_speech, etymology, usage_notes,
    synonyms: [...], related_words: [...],
    idioms: [{ phrase, meaning }],
    definitions: [
      { id, level: "basic"|"standard"|"advanced", text, sentences: [...], examples: [...] }
    ]
  }
```

### Admin endpoints

All admin routes require the header `x-admin-password: <ADMIN_PASSWORD>` and `ADMIN_ENABLED=true`.

| Method   | Path                                | Description                        |
|----------|-------------------------------------|------------------------------------|
| `GET`    | `/api/admin/stats`                  | Total/fully-defined/incomplete counts + recent activity |
| `GET`    | `/api/admin/words`                  | All words with `definition_count`  |
| `POST`   | `/api/admin/words`                  | Create a word                      |
| `PUT`    | `/api/admin/words/:id`              | Update a word                      |
| `DELETE` | `/api/admin/words/:id`              | Delete a word and its definitions  |
| `POST`   | `/api/admin/definitions`            | Upsert a definition for a word     |
| `DELETE` | `/api/admin/definitions/:id`        | Delete a definition                |
| `GET`    | `/api/admin/wiktionary/:word`       | Fetch + save a Wiktionary draft    |
| `POST`   | `/api/admin/import/json`            | Bulk import from JSON array        |

---

## Data Format

### JSON import schema

The import endpoint and `data/seed.json` both accept this format:

```json
[
  {
    "word": "define",
    "part_of_speech": "verb",
    "etymology": "From Latin 'definire'...",
    "usage_notes": "...",
    "synonyms": ["specify", "describe"],
    "related_words": ["definition", "definite"],
    "idioms": [
      { "phrase": "define oneself", "meaning": "To establish one's identity..." }
    ],
    "definitions": [
      {
        "level": "basic",
        "text": "To say clearly what something means.",
        "sentences": ["Can you define the word 'justice'?"],
        "examples": ["She defined the terms at the start of her essay."]
      },
      {
        "level": "standard",
        "text": "To state or describe exactly the nature, scope, or meaning of something.",
        "sentences": ["The treaty defines the borders of the territory."],
        "examples": ["Philosophers have long tried to define consciousness."]
      },
      {
        "level": "advanced",
        "text": "To determine or identify the essential qualities or meaning of; to fix the boundaries or extent of with precision.",
        "sentences": ["The court must define the limits of executive privilege."],
        "examples": ["His work defined an entire era of computational linguistics."]
      }
    ]
  }
]
```

All fields except `word` and `definitions` are optional. Import is upsert — existing words are updated, not duplicated.

---

## Theme System

Themes are based on the [DelphiNet6](https://github.com/0xnullsect0r/DelphiNet6) CSS-variable approach. There are 14 semantic tokens:

| Token              | Tailwind class        | Purpose                    |
|--------------------|-----------------------|----------------------------|
| `--color-bg-base`  | `bg-bg-base`          | Page background            |
| `--color-bg-surface` | `bg-bg-surface`     | Cards, panels              |
| `--color-bg-elevated` | `bg-bg-elevated`   | Dropdowns, hover layers    |
| `--color-bg-hover` | `bg-bg-hover`         | Hover highlight            |
| `--color-border`   | `border-border`       | All borders                |
| `--color-brand`    | `bg-brand`, `text-brand` | Primary accent / CTA    |
| `--color-brand-hover` | `bg-brand-hover`   | Brand hover state          |
| `--color-brand-muted` | `bg-brand/20`      | Subtle brand tint          |
| `--color-text-primary` | `text-text-primary` | Main text                |
| `--color-text-secondary` | `text-text-secondary` | Subdued text         |
| `--color-text-disabled` | `text-text-disabled` | Placeholder / disabled  |
| `--color-danger`   | `text-danger`         | Errors, destructive actions |
| `--color-warning`  | `text-warning`        | Warnings                   |
| `--color-success`  | `text-success`        | Success states             |

### Built-in themes

| Key              | Name                |
|------------------|---------------------|
| `delphinet`      | Delphinet (Default) — dark green |
| `midnight`       | Midnight — dark indigo |
| `dracula`        | Dracula — purple/pink |
| `nord`           | Nord — arctic blue  |
| `monokai`        | Monokai — warm dark |
| `solarized-dark` | Solarized Dark      |
| `solarized-light`| Solarized Light     |
| `light`          | Light — clean white |
| `synthwave`      | Synthwave — neon    |
| `gruvbox`        | Gruvbox — warm retro |

### Custom themes

Click the palette icon in any page header to open the **Theme Editor**. Pick colors for all 14 tokens, preview live, and save. Custom themes are stored in `localStorage` under the key `heron:customThemes`.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
npm install
npm run dev          # tsx watch — hot reload on save
# API available at http://localhost:3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev          # Vite dev server with HMR
# App available at http://localhost:5173
# API calls proxy to http://localhost:3001 via vite.config.ts
```

---

## Study-Tech Word Clearing

The app is designed around L. Ron Hubbard's Study Technology principle that misunderstood words are the primary barrier to learning. Key features reflecting this:

1. **Three definition levels** — start with Basic (simple, concrete) and work up to Advanced only as needed. Never begin with the most complex definition.
2. **Example sentences** — multiple real-usage sentences per definition, not just a single contrived example.
3. **Usage examples** — practical contexts showing the word in different grammatical roles.
4. **Study-Tech reminder** — a prompt on every word view to use the word in your own original sentence before moving on.
5. **Etymology** — understanding the root meaning helps make definitions stick.
6. **Idioms** — common phrases that use the word in non-literal ways (a frequent source of confusion).

---

## License

See [LICENSE](LICENSE).
