# <span style="color: #ffffff;"><font color="#ffffff"><b>🏮 Lantern — Silent Help Signal App</b></font></span>

### <span style="color: #ffffff;"><font color="#ffffff"><b>One tap. Everyone knows. Someone shows up.</b></font></span>

> **Instant emergency alert app for private Circles.**  
> No accounts required. One tap alerts your entire Circle in real time.

<br>

🌐 **Live Deployment App**: [https://app-2aa9-3000.prg1.zerops.app/](https://app-2aa9-3000.prg1.zerops.app/)  
📦 **Repository**: [github.com/garvghildiyal-lab/lantern-app](https://github.com/garvghildiyal-lab/lantern-app)

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>⚡ Key Highlights</b></font></span>

- **🔒 Accountless Private Circles**: Create or join via display name & a 6-character invite code.

- **🚨 230px One-Tap Lantern Button**: Large, pulsing button for tactile emergency signal dispatch.

- **📱 Full-Screen Emergency Overlay**: Room members get a full-screen alert with an **"I'm Here"** button.

- **✅ Real-Time Acknowledgment**: Instant confirmation toasts sent back to the sender when help is on the way.

- **⚡ Socket.io Broadcasting**: Sub-second room-based event synchronization across all devices.

- **💾 Embedded Persistence**: SQLite via `better-sqlite3` with WAL mode & zero configuration.

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>🌐 Live App Link</b></font></span>

Visit the application live on any desktop or mobile browser:  
👉 **[https://app-2aa9-3000.prg1.zerops.app/](https://app-2aa9-3000.prg1.zerops.app/)**

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>🛠️ Tech Stack</b></font></span>

- **Backend**: Node.js 20 & Express.js
- **Real-Time**: Socket.io (Room-based events)
- **Database**: SQLite (`better-sqlite3`)
- **Frontend**: Mobile-first Vanilla HTML5, CSS3 & JS
- **Deployment**: Zerops PaaS via ZCP

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>🚀 API Endpoint Reference</b></font></span>

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/health` | Service health check (`200 "ok"`) |
| `POST` | `/api/circles` | `{ name, owner_name }` $\rightarrow$ Creates circle & generates invite code |
| `POST` | `/api/circles/join` | `{ invite_code, name }` $\rightarrow$ Joins existing circle |
| `GET` | `/api/circles/:id/members` | Returns member list for a circle |
| `POST` | `/api/signals` | `{ circle_id, sender_name }` $\rightarrow$ Dispatches signal & broadcasts `signal:new` |
| `POST` | `/api/signals/:id/acknowledge` | `{ acknowledged_by }` $\rightarrow$ Acknowledges & broadcasts `signal:acknowledged` |
| `GET` | `/api/circles/:id/signals` | Returns recent signals for a circle |

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>💻 Quick Start & Running</b></font></span>

1. **Clone Repository**:
   ```bash
   git clone https://github.com/garvghildiyal-lab/lantern-app.git
   cd lantern-app
   ```

<br>

2. **Install Dependencies**:
   ```bash
   npm install
   ```

<br>

3. **Start Application Server**:
   ```bash
   npm start
   ```
   *Visit app at: `https://app-2aa9-3000.prg1.zerops.app/`.*

<br>

4. **Run Real-Time Socket Test**:
   ```bash
   node test_socket.js
   ```

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>☁️ Deployment on Zerops</b></font></span>

Deploy updates instantly using Zerops CLI:

```bash
zcli push app
```

---

<br>

## <span style="color: #ffffff;"><font color="#ffffff"><b>📄 License</b></font></span>

MIT © 2026 Lantern Team

