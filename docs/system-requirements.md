# System Requirements Specification

## 1. Runtime Environment & Technology Stack

The IMovies platform is engineered with modern full-stack JavaScript/TypeScript technologies.

| Component | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Runtime Environment** | Node.js | v20.x or v22.x LTS | Server runtime and execution environment |
| **Package Manager** | npm / bun | npm v10+ / bun v1+ | Package dependency management |
| **Server Framework** | Express | ^4.21.2 | REST API routing, middleware pipeline, static serving |
| **Client Framework** | React | ^19.0.1 | Reactive Single Page Application |
| **Language** | TypeScript | ^7.0.2 / ES2022 | Strong static typing across client and server |
| **Build Tooling** | Vite | ^8.3.0 | Module bundling and development server |
| **Execution Tooling** | tsx | ^4.21.0 | TypeScript execution engine for server.ts |
| **CSS Engine** | Tailwind CSS | ^4.3.3 | Modern CSS utility framework |
| **Iconography** | Lucide React | ^0.546.0 | Semantic SVG interface icons |
| **Animations** | Motion | ^12.23.24 | Micro-interactions and smooth transitions |

---

## 2. Hardware and Infrastructure Specifications

### 2.1 Minimum Production Specs
- **CPU**: 1 vCPU (2.0 GHz or higher)
- **Memory (RAM)**: 512 MB minimum (1 GB recommended for high concurrent seat locking)
- **Disk Space**: 200 MB for node_modules and pre-built frontend distribution
- **Network Ports**: Inbound TCP port `3000` (configurable via `PORT` environment variable)

### 2.2 Client Browser Compatibility
- Modern evergreen browsers with Web Crypto and ES2022 support:
  - Google Chrome $\ge$ 110
  - Mozilla Firefox $\ge$ 115
  - Apple Safari $\ge$ 16.4
  - Microsoft Edge $\ge$ 110
- Responsive display viewports: Desktop (1440px baseline), Tablet (768px - 1024px), Mobile ($\ge$ 375px).

---

## 3. Configuration & Environment Variables

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `3000` | Port for the Express server and Vite development proxy. |
| `NODE_ENV` | Optional | `development` | Set to `production` when serving compiled static assets from `/dist`. |
| `JWT_SECRET` | Optional | `imovies_super_secret_jwt_key_2026` | Cryptographic secret for signing and verifying JWT tokens. |
| `MONGODB_URI` | Optional | `""` | Connection string for external MongoDB cluster (falls back to in-memory store). |
| `GEMINI_API_KEY` | Optional | `""` | AI Studio environment key for server-side generative capabilities. |
| `APP_URL` | Optional | `""` | Base deployment URL of the hosted application. |

---

## 4. Software Dependencies

```json
{
  "dependencies": {
    "@google/genai": "^2.4.0",
    "@tailwindcss/vite": "^4.3.3",
    "@vitejs/plugin-react": "^6.1.1",
    "dotenv": "^17.2.3",
    "express": "^4.21.2",
    "lucide-react": "^0.546.0",
    "motion": "^12.23.24",
    "react": "^19.0.1",
    "react-dom": "^19.0.1",
    "vite": "^8.3.0"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/node": "^22.14.0",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "autoprefixer": "^10.4.21",
    "esbuild": "^0.25.0",
    "tailwindcss": "^4.3.3",
    "tsx": "^4.21.0",
    "typescript": "^7.0.2"
  }
}
```
