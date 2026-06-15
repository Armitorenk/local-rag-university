[![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-F7DF1E?logo=javascript&logoColor=000)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![Node.js](https://img.shields.io/badge/Node.js-%E2%89%A5%2020-339933?logo=node.js&logoColor=fff)](https://nodejs.org/)
[![Foundry Local](https://img.shields.io/badge/Foundry%20Local-On--Device%20AI-0078D4?logo=microsoft&logoColor=fff)](https://foundrylocal.ai)
[![Phi-3.5 Mini](https://img.shields.io/badge/Model-Phi--3.5%20Mini%20Instruct-6B21A8)](https://huggingface.co/microsoft/Phi-3.5-mini-instruct)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Offline](https://img.shields.io/badge/Connectivity-100%25%20Offline-brightgreen)]()

# University Assistant – Offline Local RAG

A fully offline, on-device **Retrieval-Augmented Generation (RAG)** assistant that answers university student questions (registration, exams, scholarships, housing, internships, graduation, and more). Built with **[Foundry Local](https://foundrylocal.ai)** and **Phi-3.5 Mini Instruct**, it runs entirely on your machine: no cloud, no API keys, no internet required.

![Landing page](screenshots/01-landing-page.png)

> **New to RAG?** Retrieval-Augmented Generation grounds an AI model's answers in a specific set of documents. Instead of relying only on what the model learned during training, RAG retrieves relevant chunks from *your* documents and feeds them to the model as context. This dramatically reduces hallucination and makes the AI useful for domain-specific tasks.

> This project is a customized fork of [`leestott/local-rag`](https://github.com/leestott/local-rag) (originally a gas-field demo), reworked into a university student assistant. See [`NOTES.md`](NOTES.md) for the full list of changes.

## What You'll Learn

1. **How RAG works end-to-end** – document ingestion, chunking, vector storage, retrieval, and generation
2. **Running AI models locally** with [Foundry Local](https://foundrylocal.ai) (no GPU required; uses GPU/NPU/CPU automatically)
3. **Building a responsive web UI** with streaming answers
4. **Streaming AI responses** using Server-Sent Events (SSE)
5. **TF-IDF vector search** with SQLite — no external vector database needed

## Architecture

```
Browser (public/index.html)
   │  POST /api/chat/stream  (question)
   ▼
Express server (src/server.js)
   │
   ├─►  VectorStore (src/vectorStore.js)  ──  SQLite (data/rag.db)
   │        TF-IDF + cosine similarity → top-3 relevant chunks
   │
   └─►  ChatEngine (src/chatEngine.js)
            builds prompt = system + retrieved context + question
            │
            ▼
        Foundry Local  →  Phi-3.5 Mini  →  streamed tokens (SSE) back to browser
```

**How a query flows:**

1. The user types a question in the browser.
2. The Express server searches the SQLite vector store for the most relevant document chunks.
3. Those chunks are injected into the prompt as context (a relevance guard drops weak matches so greetings/off-topic input don't trigger hallucination).
4. Foundry Local generates a response using Phi-3.5 Mini, grounded in the retrieved context.
5. The response streams back to the browser via SSE, token by token.

## Features

- **100% offline** – no internet, no cloud, no outbound calls
- **RAG retrieval** – answers grounded in local university documents, with source citations
- **Streaming responses** – real-time SSE streaming to the UI
- **Per-answer actions** – Copy, Regenerate, and Stop generation
- **Conversation history** – timestamps, Markdown export, and localStorage persistence (survives refresh)
- **Document upload** – add new `.md`/`.txt` documents from the UI at runtime
- **Responsive dark UI** – minimal, full-width, works on phone, tablet, and desktop
- **Compact mode** – toggle for constrained / low-latency devices

| Desktop | Mobile |
|---------|--------|
| ![Desktop view](screenshots/01-landing-page.png) | ![Mobile view](screenshots/02-mobile-view.png) |

## Prerequisites

- **Node.js** ≥ 20: [Download here](https://nodejs.org/)
- **Foundry Local**: Microsoft's on-device AI runtime
  ```
  winget install Microsoft.FoundryLocal
  ```
- The **phi-3.5-mini** model (auto-downloaded on first run, approximately 2 GB)

## Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/Armitorenk/local-rag-university.git
cd local-rag-university

# 2. Install dependencies
npm install

# 3. Ingest the university documents into the local vector store
npm run ingest

# 4. Start the server (starts Foundry Local automatically)
npm start
```

Open **http://127.0.0.1:3000** in a browser.

> On first start, the Foundry Local SDK fetches the model catalog from the cloud once. If that call is rate-limited (HTTP 429), `src/chatEngine.js` retries with backoff automatically — the model itself still runs locally.

### What Happens at Startup

1. **`npm run ingest`** reads every `.md` file in `docs/`, splits them into overlapping chunks, computes TF-IDF vectors, and stores everything in `data/rag.db` (SQLite).
2. **`npm start`** uses the Foundry Local SDK to discover and load the Phi-3.5 Mini model from the local catalog, opens the vector store, and starts the Express server on port 3000.

## Chatting with the Assistant

Type a question or tap one of the quick-action chips. The assistant retrieves relevant chunks and generates a grounded answer:

![Chat response with step-by-step guidance](screenshots/03-chat-response.png)

Every response includes expandable source references so you can verify which documents the answer came from:

![Sources panel showing retrieved documents and relevance scores](screenshots/04-sources-panel.png)

### Mobile Chat

The UI is fully responsive — the same interface reflows for mobile devices:

![Mobile chat view](screenshots/06-mobile-chat.png)

## Uploading Documents

Expand the knowledge base without restarting. Click the attach button to open the upload modal:

![Upload document modal with indexed document list](screenshots/05-upload-document.png)

Drag-and-drop or browse for `.md`/`.txt` files. They are chunked and indexed immediately.

### Via File System

1. Add `.md` files to the `docs/` folder (with optional YAML front-matter for title/category/id).
2. Run `npm run ingest` and restart the server to re-index all documents.

### Document Format

```markdown
---
title: My Topic Title
category: Academic Affairs
id: AK-099
---

# My Topic Title

## Section
- Important note here.

## Steps
1. Step one.
2. Step two.
```

## Project Structure

```
LOCAL-RAG-UNIVERSITY/
├── docs/                     # 12 university RAG documents
│   ├── 01-course-registration.md
│   ├── 02-exams-grading.md
│   ├── 03-attendance.md
│   ├── ...
│   └── 12-counseling-health.md
├── public/
│   ├── index.html            # Web UI (single-file, no build step)
│   └── index.original.html   # Backup of the original UI
├── src/
│   ├── chatEngine.js         # Foundry Local + RAG orchestration (+ catalog retry)
│   ├── chunker.js            # Chunking + TF-IDF vector computation
│   ├── config.js             # App configuration (model, paths, chunk sizes)
│   ├── ingest.js             # Batch document ingestion script
│   ├── prompts.js            # System prompts (full + compact)
│   ├── server.js             # Express server + API endpoints
│   └── vectorStore.js        # SQLite-backed local vector store
├── scripts/
│   └── screenshots.mjs       # Regenerate README screenshots from the live app
├── screenshots/              # App screenshots
├── test/                     # Unit tests (Node.js test runner)
├── data/                     # Generated at runtime (rag.db, git-ignored)
├── NOTES.md                  # What was customized vs the original
├── package.json
└── README.md
```

## How the RAG Pipeline Works

### 1. Document Ingestion (`src/ingest.js`)

Reads `.md` files from `docs/`, parses optional YAML front-matter, then splits the content into overlapping chunks (default: ~200 tokens with 25-token overlap). Each chunk is stored with its TF-IDF vector in SQLite.

### 2. Vector Store (`src/vectorStore.js`)

A lightweight vector store backed by SQLite (via `better-sqlite3`). Stores document chunks alongside their TF-IDF vectors, with an inverted index for fast candidate filtering. At query time it cosine-similarity-ranks candidates against the query vector and returns the top-K results.

### 3. Chat Engine (`src/chatEngine.js`)

Orchestrates the full RAG flow:
- Converts the user's question into a TF-IDF vector
- Retrieves the top-K most relevant chunks (a relevance guard drops weak matches)
- Builds a prompt with the system instructions + retrieved context + user question
- Sends it to the local Phi-3.5 Mini model via Foundry Local
- Streams the response back token-by-token

### 4. System Prompts (`src/prompts.js`)

Two prompt variants:
- **Full mode**: detailed instructions for grounded, structured responses
- **Compact mode**: minimal prompt for constrained devices with limited context windows

## Chunking Strategy

This project uses a **fixed-size sliding window with overlap** — documents are split into chunks of **~200 whitespace-delimited tokens** with a **25-token overlap** (configured in [`src/config.js`](src/config.js)). The core logic lives in [`src/chunker.js`](src/chunker.js):

1. YAML front-matter (title, category, id) is stripped and stored as metadata
2. The body text is tokenized by whitespace
3. A sliding window walks through the tokens, emitting one chunk per step
4. Each new window starts 25 tokens before the previous one ended, creating overlap
5. Documents shorter than 200 tokens are kept as a single chunk

### Why Fixed-Size Sliding Window?

| Design constraint | How fixed-size chunking helps |
|---|---|
| **Small local model (Phi-3.5 Mini)** | Compact 200-token chunks leave room in the context window for the system prompt, conversation, and generated output |
| **NPU/CPU execution** | No embedding model needed for chunking — just string operations |
| **Zero dependencies** | No tokenizer library, no embedding runtime, no vector database |
| **Predictable memory** | Uniform chunk sizes keep retrieval cost and context usage consistent |

### When to Consider Switching

- **Hundreds of long documents** → recursive or section-aware chunking
- **Embedding-based retrieval** → semantic chunking paired with vector similarity
- **Mixed content** (tables, code, prose) → format-aware chunking

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/chat` | Non-streaming chat completion |
| `POST` | `/api/chat/stream` | Streaming chat via SSE |
| `POST` | `/api/upload` | Upload a document to the knowledge base |
| `GET` | `/api/docs` | List indexed documents |
| `GET` | `/api/health` | Health check |

## Knowledge Base

The 12 included documents cover:

| Category | Documents |
|----------|-----------|
| Academic Affairs | Course registration, exams & grading, attendance, graduation, internship, transfers, academic calendar & leave of absence |
| Student Services | Scholarships & financial aid, housing & dormitories, counseling & health |
| Campus Services | Library services |
| Rules | Student disciplinary rules |

## Compact Mode

Toggle **Compact** in the composer for constrained / low-latency devices:

| Setting | Full Mode | Compact Mode |
|---------|-----------|--------------|
| System prompt | Detailed | Minimal |
| Max output tokens | 768 | 384 |
| Retrieved chunks | 3 | 3 |

## Key Concepts for New Developers

### What is Foundry Local?

[Foundry Local](https://foundrylocal.ai) is Microsoft's on-device AI runtime. It runs small language models (SLMs) like Phi-3.5 Mini directly on your machine — no GPU required and no cloud dependency. The SDK manages model discovery, download, loading, and inference programmatically.

```js
import { FoundryLocalManager } from "foundry-local-sdk";

const manager = FoundryLocalManager.create({ appName: "university-assistant" });
const model = await manager.catalog.getModel("phi-3.5-mini");
await model.download();
await model.load();

const chatClient = model.createChatClient();
const response = await chatClient.completeChat([
  { role: "user", content: "What is the attendance requirement?" }
]);
console.log(response.choices[0].message.content);
```

### What is TF-IDF?

TF-IDF (Term Frequency–Inverse Document Frequency) is a classic information retrieval technique. Each chunk becomes a numeric vector based on how important each word is within that chunk. At query time the question is vectorized the same way and compared against all stored vectors using cosine similarity — no embedding model required, keeping everything lightweight and offline.

### Why SQLite for Vectors?

For small-to-medium collections (hundreds to low thousands of chunks), SQLite is fast enough for brute-force cosine similarity and adds zero infrastructure — just a single `.db` file on disk.

## Running Tests

```bash
npm test
```

Tests use the built-in Node.js test runner (no extra dependencies).

## Scripts

| Script | Command | Description |
|--------|---------|-------------|
| Ingest | `npm run ingest` | Chunk and index all docs into SQLite |
| Start | `npm start` | Start the server |
| Dev | `npm run dev` | Start with auto-restart on file changes |
| Test | `npm test` | Run unit tests |
| Screenshots | `npm run screenshots` | Regenerate README screenshots from the live app (requires the server running + local Chrome/Edge) |

## Adapting This for Your Own Use Case

1. **Replace the documents** in `docs/` with your own `.md` files
2. **Edit the system prompt** in `src/prompts.js` to match your domain and tone
3. **Adjust chunk sizes** in `src/config.js`
4. **Swap the model** in `src/config.js` to any model in the Foundry Local catalog
5. **Customise the UI** — the frontend is a single HTML file with inline CSS

## License

MIT – a scenario sample for learning and experimentation.
