<div align="center">

![header](https://capsule-render.vercel.app/api?type=waving&color=0:0f0c29,50:302b63,100:24243e&text=Anizen%20Proxy&height=220&fontSize=60&fontColor=ffffff&fontAlignY=40&desc=A+lightweight+proxy+bridge+between+anizen.site+%E2%86%92+anikai.to&descAlignY=62&descSize=18)

<br/>

![Node](https://img.shields.io/badge/Node.js-18+-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express](https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-6c63ff?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-Active-00d4aa?style=for-the-badge)
![CORS](https://img.shields.io/badge/CORS-Restricted-ff6b6b?style=for-the-badge)

</div>

---

## ✨ Features

- 🔄 **Auto Session Refresh** — Automatically fetches a fresh session from `anikai.to` every 30 minutes
- 🍪 **Cookie Caching** — Reduces redundant requests with a built-in TTL cache
- ⚡ **Stale Session Detection** — Detects and retries when an AJAX response returns stale HTML
- 🔒 **CORS Locked** — Only `https://www.anizen.site` is allowed through
- 🩺 **Health Endpoint** — Simple `/` check to confirm the proxy is alive
- 🌐 **Full Proxy Routing** — All `/anikai/*` requests are forwarded to `anikai.to/*`

---

## 🚀 Getting Started

### Prerequisites

- Node.js `18+`
- npm or yarn

### Installation

```bash
git clone https://github.com/ChadsPH/anizen-proxy
cd anizen-proxy
npm install
```

### Running

```bash
# Development
npm run dev

# Production
npm start
```

Server starts on **port 3000** by default.

---

## ⚙️ Environment Variables

| Variable | Description | Default |
|---|---|---|
| `PORT` | Port the server listens on | `3000` |
| `ANIKAI_COOKIE` | Fallback cookie if session fetch fails | `""` |

Create a `.env` file in the root:

```env
PORT=3000
ANIKAI_COOKIE=__p_mov=1; usertype=guest; session=your_session_here
```

---

## 📡 API Routes

| Method | Route | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `ANY` | `/anikai/*` | Proxy to `anikai.to/*` |

### Example

```bash
# Proxies → https://anikai.to/anime/1
GET http://localhost:3000/anikai/anime/1

# Proxies → https://anikai.to/ajax/episode/list?id=123
GET http://localhost:3000/anikai/ajax/episode/list?id=123
```

---

## 🧠 How It Works

```
Browser (anizen.site)
      │
      │  GET /anikai/ajax/...
      ▼
 Anizen Proxy  ──── session cache ────┐
      │                               │
      │  Injects headers + cookies    │ refresh every 30min
      ▼                               │
  anikai.to  ────────────────────────┘
      │
      │  Returns JSON / HTML
      ▼
Browser (anizen.site)
```

1. Request comes in at `/anikai/*`
2. Proxy checks the session cache (TTL: 30 min)
3. If stale or empty, fetches a fresh session from `anikai.to/home`
4. Forwards the request with browser-like headers
5. For AJAX routes, detects if the response is stale HTML and retries once

---

## 🔒 CORS Policy

Only requests from `https://www.anizen.site` are accepted.

```
Access-Control-Allow-Origin: https://www.anizen.site
```

All other origins will be blocked by the browser.

---

## 📁 Project Structure

```
anizen-proxy/
├── index.js        # Main proxy server
├── .env            # Environment variables (not committed)
├── package.json
└── README.md
```

---

## 📜 License

MIT © [ChadsPH](https://github.com/ChadsPH)

---

<div align="center">

![footer](https://capsule-render.vercel.app/api?type=waving&color=0:24243e,50:302b63,100:0f0c29&height=120&section=footer)

</div>
