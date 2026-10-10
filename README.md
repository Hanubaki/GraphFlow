<div align="center">

# ⚡ GraphFlow

### Interactive Distributed Architecture & Real-Time Data Flow Simulator

[![React](https://img.shields.io/badge/React-18.3-61dafb.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178c6.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-6.0-646cff.svg?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Passing-729B1B.svg?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

**GraphFlow** is a browser-based, high-performance visual architecture design and data flow simulation engine. It empowers developers and architects to design distributed systems (gateways, microservices, caches, message queues, databases) and simulate real-time traffic, latency, network errors, and throughput with animated packets moving along cubic bezier curves.

[Report Bug](https://github.com/Hanubaki/GraphFlow/issues) · [Request Feature](https://github.com/Hanubaki/GraphFlow/issues)

</div>

---

## 🌟 Key Engineering Highlights

* **Pure Native Mathematics (Zero External Canvas Dependencies):** Dynamic cubic bezier curves ($B(t)$ De Casteljau evaluation) rendered cleanly with native SVG and DOM nodes for maximum performance and 60 FPS fluidity.
* **Decoupled Simulation Engine:** A tick-based `requestAnimationFrame` loop animating packets along edge tangents, computing live throughput (RPS), jitter, and service latency.
* **Fault Injection & Chaos Engineering:** Configurable error rates and latency across nodes and pipelines, with visual failure packets (HTTP 500) and retry routes.
* **Command Pattern History Stack:** Production-grade Undo/Redo stack with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).
* **Pre-Configured Architecture Archetypes:**
  - 🛒 *E-Commerce Distributed System* (API Gateway $\rightarrow$ Order/Auth Services $\rightarrow$ Redis $\rightarrow$ Kafka $\rightarrow$ Payment Processor $\rightarrow$ Stripe)
  - 🤖 *AI RAG Pipeline* (React Client $\rightarrow$ FastAPI Gateway $\rightarrow$ Vector Database $\rightarrow$ Gemini LLM $\rightarrow$ S3 Storage)
  - ⚡ *Real-Time WebSocket Cluster* (Browser Clients $\rightarrow$ HAProxy Load Balancer $\rightarrow$ Socket Nodes $\rightarrow$ Redis Pub/Sub)
* **One-Click Export & Documentation Generator:** Generates production-ready Markdown specifications with embedded Mermaid diagrams for your project's `README.md`.
* **Subtle Synthesized Audio (Web Audio API):** Interactive tactile sound effects for node connections, packet transmissions, and traffic spikes (fully toggleable).

---

## 🛠️ Architecture & Data Flow

```mermaid
flowchart TD
    subgraph UI ["User Interface Layer"]
        TopBar["Top Navigation & Telemetry Meters"]
        Sidebar["Component Palette (Draggable Catalog)"]
        Canvas["Interactive SVG/DOM Graph Canvas"]
        Inspector["Contextual Property Inspector"]
    end

    subgraph Core ["State & Simulation Layer"]
        GraphStore["Graph State Store (Nodes, Edges, Viewport)"]
        History["Command Pattern History (Undo/Redo)"]
        SimLoop["Simulation Loop (requestAnimationFrame)"]
    end

    subgraph Engine ["Geometry & Audio Engine"]
        BezierEngine["Cubic Bezier Calculation (De Casteljau)"]
        SoundSynth["Web Audio API Synthesizer"]
    end

    Sidebar -->|Drag & Drop| Canvas
    Canvas <--> GraphStore
    TopBar <--> SimLoop
    SimLoop -->|Calculates Packets| BezierEngine
    BezierEngine -->|Renders Coordinates| Canvas
    GraphStore <--> History
    Inspector <--> GraphStore
    SimLoop -.->|Audio Triggers| SoundSynth
```

---

## 🚀 Quick Start

### Prerequisites
* Node.js (v18 or higher)
* npm / pnpm / yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/Hanubaki/GraphFlow.git

# Navigate into project directory
cd GraphFlow

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` in your browser.

---

## 🧪 Automated Testing
GraphFlow includes comprehensive unit tests verifying the bezier geometry engine, packet positioning, and documentation generators.

```bash
# Run test suite
npm test
```

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Action |
| :--- | :--- |
| `Ctrl + Z` / `Cmd + Z` | Undo last graph modification |
| `Ctrl + Y` / `Cmd + Y` | Redo action |
| `Delete` / `Backspace` | Remove selected node or connection |
| `Escape` | Deselect active component |
| `Mouse Drag` | Pan infinite canvas |
| `Mouse Wheel` | Zoom in / out (30% to 250%) |

---

## 👨‍💻 Author

**Berke Akdemir**
* GitHub: [@Hanubaki](https://github.com/Hanubaki)

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).
