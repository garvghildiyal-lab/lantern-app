# 🏮 Lantern — One-Tap Silent Help-Signal App

> **Instant emergency alert app for private Circles.**  
> No accounts, no password clutter — just a single tap to alert everyone in your Circle in real time.

---

## ⚡ Overview

**Lantern** is a lightweight, mobile-first silent safety signal application designed for families, dorm mates, and private groups. Users create or join a private Circle using a 6-character invite code. When someone needs urgent assistance, a single tap on the glowing **Lantern** button dispatches a real-time signal to all Circle members simultaneously.

---

## ✨ Features

- **🔒 Accountless Private Circles**: Create or join circles instantly using display names and short invite codes (e.g., `550E23`).
- **🚨 One-Tap Alert Button**: Large, pulsing 230px button centered on screen for fast, tactile emergency signal dispatch.
- **📱 Full-Screen Receiver Overlay**: When a signal is sent, all members receive a full-screen, pulsing red emergency overlay with an **"I'm Here"** button.
- **✅ Real-Time Acknowledgment**: When a member taps "I'm Here", the sender receives an instant notification that help is on the way.
- **⚡ Real-Time Socket.io Sync**: Instant room-based websocket event broadcasting for new signals and acknowledgments.
- **💾 Embedded Storage**: Powered by `better-sqlite3` with WAL mode for concurrency and zero external database setup.
- **🚀 Zerops Native**: Pre-configured for automated deployment on Zerops via `zerops.yml`.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend** | Node.js (v20), Express.js |
| **Real-time Engine** | Socket.io (Room-based broadcasting) |
| **Database** | SQLite via `better-sqlite3` |
| **Frontend** | Vanilla HTML5 / Modern CSS3 (Glassmorphism & CSS Animations) |
| **Deployment** | Zerops PaaS (`zcli`) |

---

## 🚀 API Endpoint Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Health check endpoint (Returns `200 "ok"`) |
| `POST` | `/api/circles` | Body: `{ name, owner_name }` — Creates a circle & generates invite code |
| `POST` | `/api/circles/join` | Body: `{ invite_code, name }` — Joins an existing circle |
| `GET` | `/api/circles/:id/members` | Returns member list for a circle |
| `POST` | `/api/signals` | Body: `{ circle_id, sender_name }` — Dispatches active signal & broadcasts `signal:new` |
| `POST` | `/api/signals/:id/acknowledge` | Body: `{ acknowledged_by }` — Acknowledges signal & broadcasts `signal:acknowledged` |
| `GET` | `/api/circles/:id/signals` | Returns recent signals for a circle |

---

## 💻 Local Quick Start

1. **Clone the repository**:
   ```bash
   git clone https://github.com/garvghildiyal-lab/lantern-app.git
   cd lantern-app
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```
   *The app will run locally at `http://localhost:3000`.*

4. **Run multi-client real-time socket test**:
   ```bash
   node test_socket.js
   ```

---

## ☁️ Deployment on Zerops

Deploying to Zerops with the Zerops CLI (`zcli`):

```bash
zcli push app
```

---

## 📄 License

MIT © 2026 Lantern Team
