<div align="center">

<img src="docs/screenshots/logo.png" alt="IVAkit Logo" width="180" />

# IVAkit

### Open-Source No-Code AI Virtual Agent Builder

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/badge/Version-0.1.0-green.svg?style=for-the-badge)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue.svg?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black.svg?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=for-the-badge)](#contributing)

**Build, test, and deploy AI-powered conversational agents without writing code.**

[🚀 Quick Start](#-quick-start) •
[📸 Screenshots](#-screenshots) •
[✨ Features](#-features) •
[📖 Documentation](#-documentation) •
[🤝 Contributing](#-contributing)

---

</div>

## 🎯 What is IVAkit?

IVAkit is a **visual conversation builder** and **runtime execution engine** for Intelligent Virtual Agents (IVAs). Designed for contact centers, CX teams, and AI engineers who want to create sophisticated conversational AI without the complexity.

<div align="center">

| 🏢 **For Contact Centers** | 🧑‍💻 **For Developers** | 🤖 **For AI Teams** |
|:---:|:---:|:---:|
| Build support IVAs visually | Extend with custom nodes | Run AI locally or in cloud |
| No coding required | Full TypeScript SDK | Model-agnostic design |
| Reduce agent workload | API-first architecture | Prompt engineering tools |

</div>

### 💡 Core Philosophy

```
┌─────────────────────────────────────────────────────────────────────┐
│                                                                     │
│  🎯 Deterministic First, LLM Second - AI is a tool, not magic      │
│  🏠 Local-First by Default - Run everything on your infrastructure │
│  🔍 No Magic Hidden Behavior - Everything is inspectable           │
│  📦 Composable Artifacts - Flows are versioned JSON                 │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

> **IVAkit IVAs are *systems*, not chatbots.**

---

## 📸 Screenshots

<div align="center">

### 🎨 Visual Flow Builder

*Drag-and-drop conversation design with 9 node types*

<img src="docs/screenshots/studio-flow-builder.png" alt="IVAkit Flow Builder" width="90%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

---

### 💬 Live Conversation Simulator

*Test flows in real-time with intent detection and confidence scores*

<img src="docs/screenshots/simulator-chat.png" alt="Simulator Chat View" width="90%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

---

### 🔍 Execution Debugger

*Step through every node with full input/output inspection*

<img src="docs/screenshots/simulator-debug.png" alt="Simulator Debug View" width="90%" style="border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15);" />

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🎨 Visual Flow Builder

- ✅ Drag-and-drop canvas
- ✅ 9 specialized node types
- ✅ Real-time validation
- ✅ Undo/Redo with history
- ✅ Dark & Light themes
- ✅ Keyboard shortcuts
- ✅ Minimap navigation
- ✅ Snap-to-grid editing
- ✅ Export/Import flows

</td>
<td width="50%">

### 🧪 Conversation Simulator

- ✅ Live flow execution
- ✅ Step-by-step debugging
- ✅ Variable inspector
- ✅ Intent confidence display
- ✅ Token & latency metrics
- ✅ Conversation history
- ✅ Reset & replay

</td>
</tr>
<tr>
<td width="50%">

### ⚡ Runtime Engine

- ✅ JSON-based flow definitions
- ✅ Node-by-node execution
- ✅ Session state management
- ✅ Channel-agnostic design
- ✅ Deterministic execution
- ✅ Full audit logging

</td>
<td width="50%">

### 🤖 AI Integration

- ✅ Ollama (local AI)
- ✅ OpenAI API
- ✅ Anthropic Claude
- ✅ Rules-based fallback
- ✅ Structured outputs
- ✅ Prompt templates

</td>
</tr>
</table>

### 📦 Node Types

| Node | Icon | Purpose | Configuration |
|------|:----:|---------|---------------|
| **Start** | 🟢 | Entry point | Welcome message |
| **Message** | 💬 | Send response | Text, delay, markdown |
| **Collect Input** | 📝 | Gather user input | Variable, validation, timeout |
| **LLM Router** | 🧠 | AI intent classification | Prompt, model, intents, threshold |
| **Knowledge Search** | 📚 | RAG retrieval | KB ID, query, top K |
| **Tool Call** | 🔧 | External API call | Tool ID, inputs, output |
| **Condition** | 🔀 | If/else branching | Conditions, operators, values |
| **Escalate** | 🚨 | Human handoff | Reason, queue, transcript |
| **End** | ⬛ | Terminate flow | Goodbye message, status |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [pnpm](https://pnpm.io/) 8+
- [Ollama](https://ollama.ai/) (optional, for local AI)

### Installation

```bash
# Clone the repository
git clone https://github.com/ryanshatz/IVAkit.git
cd IVAkit

# Install dependencies
pnpm install

# Start development servers
pnpm dev
```

**That's it!** Open [http://localhost:3000](http://localhost:3000) to start building.

### 🐳 Docker Setup

```bash
# Start all services
docker-compose up -d

# Services available:
# - Studio:  http://localhost:3000
# - API:     http://localhost:3001
# - Ollama:  http://localhost:11434
```

### 🤖 Local AI with Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Pull a model
ollama pull llama3.2

# IVAkit auto-connects to localhost:11434
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + Z` | Undo |
| `Ctrl/Cmd + Shift + Z` | Redo |
| `Ctrl/Cmd + S` | Save flow |
| `Delete` | Delete selected node |
| `Ctrl/Cmd + D` | Duplicate node |
| `Ctrl/Cmd + E` | Export flow |
| `Ctrl/Cmd + I` | Import flow |
| `?` | Show help |

---

## 🏗️ Architecture

```
                          ┌─────────────────────────────────┐
                          │         IVAkit Studio           │
                          │  ┌─────────┬─────────┬───────┐  │
                          │  │  Node   │  Flow   │ Config│  │
                          │  │ Palette │ Canvas  │ Panel │  │
                          │  └─────────┴─────────┴───────┘  │
                          └───────────────┬─────────────────┘
                                          │ tRPC
                                          ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           API Server (Hono)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────┐ │
│  │   Flows API  │  │ Sessions API │  │ Knowledge API│  │ Analytics│ │
│  └──────────────┘  └──────────────┘  └──────────────┘  └──────────┘ │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         ▼                     ▼                     ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Flow Runtime   │  │    Database     │  │   AI Service    │
│  ┌───────────┐  │  │    (SQLite)     │  │  ┌───────────┐  │
│  │  Engine   │  │  │  ┌───────────┐  │  │  │  Ollama   │  │
│  │  Executor │  │  │  │  Drizzle  │  │  │  │  OpenAI   │  │
│  │  Handlers │  │  │  │    ORM    │  │  │  │ Anthropic │  │
│  └───────────┘  │  │  └───────────┘  │  │  └───────────┘  │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

---

## 📁 Project Structure

```
IVAkit/
├── 📁 apps/
│   ├── 📁 studio/              # Next.js visual builder
│   │   ├── src/
│   │   │   ├── app/            # App router pages
│   │   │   ├── components/     # React components
│   │   │   └── store/          # Jotai state management
│   │   └── package.json
│   └── 📁 api/                 # Hono API server
│       ├── src/
│       │   ├── router.ts       # tRPC routes
│       │   └── context.ts      # Request context
│       └── package.json
├── 📁 packages/
│   ├── 📁 shared/              # Types, schemas, utils
│   ├── 📁 database/            # Drizzle ORM + SQLite
│   ├── 📁 runtime/             # Flow execution engine
│   └── 📁 ai/                  # AI provider adapters
├── 📁 docs/                    # Documentation
│   ├── flow-spec.md            # Flow specification
│   └── screenshots/            # App screenshots
└── 📁 docker/                  # Docker configs
```

---

## 🛠️ Tech Stack

<div align="center">

| Category | Technologies |
|----------|-------------|
| **Frontend** | ![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js) ![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.3-3178C6?logo=typescript&logoColor=white) ![Tailwind](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss&logoColor=white) |
| **State** | ![Jotai](https://img.shields.io/badge/Jotai-2.6-black) ![React Flow](https://img.shields.io/badge/React_Flow-11-FF6B6B) |
| **Backend** | ![Hono](https://img.shields.io/badge/Hono-4.0-E36002?logo=hono&logoColor=white) ![tRPC](https://img.shields.io/badge/tRPC-10-2596BE) ![Bun](https://img.shields.io/badge/Bun-1.0-black?logo=bun&logoColor=white) |
| **Database** | ![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white) ![Drizzle](https://img.shields.io/badge/Drizzle-ORM-C5F74F) |
| **AI** | ![Ollama](https://img.shields.io/badge/Ollama-Local-black) ![OpenAI](https://img.shields.io/badge/OpenAI-API-412991?logo=openai&logoColor=white) ![Anthropic](https://img.shields.io/badge/Anthropic-Claude-D97757) |

</div>

---

## 📖 Documentation

| Document | Description |
|----------|-------------|
| [📋 Flow Specification](docs/flow-spec.md) | Complete flow JSON schema |
| [🔧 Node Reference](docs/flow-spec.md#node-types) | Detailed node documentation |
| [🚀 Deployment Guide](docs/deployment.md) | Production deployment |
| [📡 API Reference](apps/api/README.md) | tRPC endpoint docs |

---

## 🗺️ Roadmap

<table>
<tr>
<td>

### v0.2 — Next Release
- [ ] Flow versioning & rollback
- [ ] Variable type validation
- [ ] Enhanced simulator replay
- [ ] Webhook inbound channel
- [ ] Flow templates library

</td>
<td>

### v0.3 — Voice Support
- [ ] WebRTC voice channel
- [ ] Twilio Media Streams
- [ ] Speech-to-text nodes
- [ ] Voice activity detection

</td>
</tr>
<tr>
<td>

### v1.0 — Enterprise
- [ ] Multi-tenant support
- [ ] Team collaboration
- [ ] Role-based access control
- [ ] Deployment pipelines

</td>
<td>

### Beyond
- [ ] CCaaS integrations
- [ ] A/B testing
- [ ] Analytics dashboard
- [ ] Plugin marketplace

</td>
</tr>
</table>

---

## 🤝 Contributing

We love contributions! Whether it's bug reports, feature requests, or code contributions.

```bash
# Fork and clone
git clone https://github.com/YOUR_USERNAME/IVAkit.git

# Create a branch
git checkout -b feature/amazing-feature

# Make your changes and test
pnpm test

# Submit a pull request
```

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed guidelines.

---

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

### Built with ❤️ for Contact Centers

<sub>
IVAkit is open-source software created to make conversational AI accessible to everyone.
</sub>

<br />

**[⭐ Star us on GitHub](https://github.com/ryanshatz/IVAkit)** — it helps!

<br />

<sub>
<a href="https://nextjs.org/">Next.js</a> •
<a href="https://reactflow.dev/">React Flow</a> •
<a href="https://ui.shadcn.com/">shadcn/ui</a> •
<a href="https://hono.dev/">Hono</a> •
<a href="https://trpc.io/">tRPC</a> •
<a href="https://ollama.ai/">Ollama</a> •
<a href="https://orm.drizzle.team/">Drizzle</a>
</sub>

</div>
