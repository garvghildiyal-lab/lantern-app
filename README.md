# 🏮 Lantern — Silent Help Signal App

**What if asking for help took just one tap?**

Not every difficult moment is an emergency. But sometimes, you simply need someone to know you need them — without calling, texting, or explaining.

**Lantern** is a one-tap silent help-signal app for trusted circles.

> **One tap. Everyone knows. Someone shows up.**

---



The application is deployed with HTTPS and has been tested end-to-end on real devices.

---

## 💡 The Problem

Calling someone requires effort. Texting requires words. Explaining what is wrong can be even harder.

Lantern removes that friction.

Create a private Circle with people you trust. When you need them, press the **Lantern** button. Everyone in your Circle instantly knows.

No accounts. No messages. No explanation.

---

## ✨ Features

* 🏮 **One-tap signal** — Send a help signal instantly.

* 🔐 **Private Circles** — Create a Circle and share a 6-character invite code.

* 👤 **No signup** — Join with just an invite code and your name.

* ⚡ **Real-time alerts** — Signals arrive instantly using Socket.io.

* 🚨 **Named alerts** — Receivers see exactly who needs help.

* 🔊 **Programmatic alert sound** — Continuous sound generated with the Web Audio API; no external audio files.

* 🤝 **Circle-wide acknowledgement** — Anyone can tap **I'm here**, stopping the alert on every device.

* 🔇 **Silent sender** — The person sending the signal doesn't hear the alert.

* 🎚️ **Sound controls** — Mute/enable and test the alert sound.

* 🌗 **Light & Dark themes**

* 📱 **Responsive, mobile-first UI**

* 🌐 **Live on Zerops with HTTPS**

---

## 🔄 How It Works

```text
Sender
  │
  │ Press Lantern
  ▼
POST /api/signals
  │
  ▼
Express + SQLite
  │
  │ Socket.io
  ▼
Circle Room
  │
  ├──────────┬──────────┐
  ▼          ▼          ▼
Member 1   Member 2   Member 3
  │
  │ "I'm here"
  ▼
POST /api/signals/:id/acknowledge
  │
  ▼
Socket.io broadcast
  │
  ▼
Alert stops on ALL devices
```

The sender sees **"Signal Dispatched"** while every other Circle member receives the active alert.

---

## 🏗️ Architecture

**Frontend → Express API → SQLite**

Real-time communication happens through **Socket.io**, using Circle-specific rooms.

When a signal is created:

1. The API stores it in SQLite.
2. Socket.io broadcasts `signal:new` to the Circle.
3. Other members display the alert and start the sound.
4. Any member can acknowledge it.
5. `signal:acknowledged` is broadcast to the entire Circle.
6. Every device stops the alert simultaneously.

---

## 🛠️ Tech Stack

| Layer                      | Technology                    |
| -------------------------- | ----------------------------- |
| Frontend                   | Vanilla HTML, CSS, JavaScript |
| Backend                    | Node.js + Express             |
| Real-time                  | Socket.io                     |
| Database                   | SQLite + better-sqlite3       |
| Audio                      | Web Audio API                 |
| Hosting                    | Zerops                        |
| Runtime                    | Node.js 20                    |
| AI Coding Agent            | Google Antigravity            |
| Infrastructure Integration | Zerops Control Plane (ZCP)    |

---

## 🌐 Why Zerops Matters

Zerops wasn't just the place where Lantern was deployed — it was part of the **development workflow**.

The project was built using **Google Antigravity**, connected to the live Zerops infrastructure through **ZCP (Zerops Control Plane)**.

This enabled an iterative:

**Build → Deploy → Test → Fix → Redeploy**

workflow directly against the live environment.

This was especially valuable for Lantern because its core feature is **real-time, cross-device communication**.

The application was deployed and verified on **real devices over HTTPS**, rather than only being tested locally.

---

## 🤖 Built with AI

Lantern was built solo using Google Antigravity as an AI coding agent.

ZCP connected the agent to the live Zerops project, allowing deployment and verification throughout development.

AI accelerated implementation, while the product design, architecture, feature decisions, testing, and iteration were driven by the project requirements.

---

## 🔌 API

```text
GET  /health
POST /api/circles
POST /api/circles/join
GET  /api/circles/:id/members
POST /api/signals
POST /api/signals/:id/acknowledge
```

---

## 🔊 Why Web Audio API?

Lantern generates its alert sound programmatically using two alternating oscillator tones.

This means:

* No MP3/WAV files
* No external audio assets
* No audio licensing concerns
* Lightweight and fully controlled in JavaScript

---

## 📱 Example Uses

Lantern can be useful for situations such as:

* An elderly parent living alone
* A new parent needing immediate support
* Someone experiencing an overwhelming moment
* Someone living alone
* Any situation where explaining what is wrong feels difficult

The message is simple:

> **"I need someone."**

And the response can be just as simple:

> **"I'm here."**

---

## 🚀 Deployment

Lantern runs on **Zerops** using a Node.js 20 service.

```text
Node.js 20
Port: 3000
HTTPS: Enabled
```

Deployment is configured through `zerops.yml`.



### The idea

Technology often makes communication easier.

Lantern tries to make **asking for help** easier.

**One tap. No explanation. Someone shows up.**

---

### Built with

**Node.js · Express · Socket.io · SQLite · Web Audio API · Zerops · Google Antigravity · ZCP**


## 🌐 Live Demo
https://app-2aa9-3000.prg1.zerops.app/