const express = require('express');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { Server } = require('socket.io');
const db = require('./src/db');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const port = process.env.PORT || 3000;

app.use(express.json());

// Serve static frontend assets from frontend/public directory
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('ok');
});

// Helper to generate a 6-character uppercase invite code
function generateInviteCode() {
  return crypto.randomBytes(3).toString('hex').toUpperCase();
}

// POST /api/circles — Create a new circle
app.post('/api/circles', (req, res) => {
  const { name, owner_name } = req.body;
  if (!name || !owner_name) {
    return res.status(400).json({ error: 'Both name and owner_name are required' });
  }

  try {
    let invite_code;
    let circleId;

    for (let attempts = 0; attempts < 5; attempts++) {
      const candidateCode = generateInviteCode();
      try {
        const insertCircle = db.prepare('INSERT INTO circles (name, owner_name, invite_code) VALUES (?, ?, ?)');
        const result = insertCircle.run(name.trim(), owner_name.trim(), candidateCode);
        circleId = result.lastInsertRowid;
        invite_code = candidateCode;
        break;
      } catch (err) {
        if (!err.message.includes('UNIQUE constraint failed')) throw err;
      }
    }

    if (!circleId) {
      return res.status(500).json({ error: 'Failed to generate unique invite code' });
    }

    // Add owner as the first member
    const insertMember = db.prepare('INSERT INTO members (circle_id, name) VALUES (?, ?)');
    insertMember.run(circleId, owner_name.trim());

    const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(circleId);
    res.status(201).json(circle);
  } catch (err) {
    console.error('Error creating circle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/circles/join — Join an existing circle via invite code
app.post('/api/circles/join', (req, res) => {
  const { invite_code, name } = req.body;
  if (!invite_code || !name) {
    return res.status(400).json({ error: 'Both invite_code and name are required' });
  }

  try {
    const circle = db.prepare('SELECT * FROM circles WHERE UPPER(invite_code) = UPPER(?)').get(invite_code.trim());
    if (!circle) {
      return res.status(404).json({ error: 'Circle not found with that invite code' });
    }

    // Check if member already exists in this circle
    const existing = db.prepare('SELECT * FROM members WHERE circle_id = ? AND name = ?').get(circle.id, name.trim());
    if (!existing) {
      db.prepare('INSERT INTO members (circle_id, name) VALUES (?, ?)').run(circle.id, name.trim());
    }

    const members = db.prepare('SELECT * FROM members WHERE circle_id = ? ORDER BY joined_at ASC').all(circle.id);
    res.json({ circle, members });
  } catch (err) {
    console.error('Error joining circle:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Presence Tracking Data Structure: Map<circleId, Map<socketId, userName>>
const activeCircleSockets = new Map();

function getCircleMembersWithPresence(circleId) {
  const members = db.prepare('SELECT * FROM members WHERE circle_id = ? ORDER BY joined_at ASC').all(circleId);
  const activeMap = activeCircleSockets.get(Number(circleId)) || new Map();
  const onlineUserNames = new Set(Array.from(activeMap.values()));

  return members.map(m => {
    const isOnline = onlineUserNames.has(m.name);
    return {
      ...m,
      is_online: isOnline
    };
  });
}

function broadcastPresenceUpdate(circleId) {
  const membersList = getCircleMembersWithPresence(circleId);
  io.to(`circle:${circleId}`).emit('presence:update', membersList);
}

// GET /api/circles/:id/members — List members of a circle with presence status
app.get('/api/circles/:id/members', (req, res) => {
  const { id } = req.params;

  try {
    const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(id);
    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const members = getCircleMembersWithPresence(id);
    res.json(members);
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/signals — Create a new signal & broadcast "signal:new"
app.post('/api/signals', (req, res) => {
  const { circle_id, sender_name, location_area } = req.body;
  if (!circle_id || !sender_name) {
    return res.status(400).json({ error: 'Both circle_id and sender_name are required' });
  }

  try {
    const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(circle_id);
    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const areaString = location_area && typeof location_area === 'string' ? location_area.trim().substring(0, 100) : null;

    const insertSignal = db.prepare(
      'INSERT INTO signals (circle_id, sender_name, status, location_area) VALUES (?, ?, ?, ?)'
    );
    const result = insertSignal.run(circle_id, sender_name.trim(), 'active', areaString);
    const signal = db.prepare('SELECT * FROM signals WHERE id = ?').get(result.lastInsertRowid);
    const totalCount = db.prepare('SELECT COUNT(*) as count FROM signals').get().count;

    console.log(`[SQL PERSISTENCE] Signal ID #${signal.id} saved to SQLite DB for Circle #${circle_id} by "${sender_name.trim()}" (Location: ${areaString || 'None'}). Total signals in DB: ${totalCount}`);

    // Broadcast "signal:new" event to room `circle:{circle_id}`
    io.to(`circle:${circle_id}`).emit('signal:new', signal);

    res.status(201).json(signal);
  } catch (err) {
    console.error('Error creating signal:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/signals/:id/acknowledge — Acknowledge a signal & broadcast "signal:acknowledged"
app.post('/api/signals/:id/acknowledge', (req, res) => {
  const { id } = req.params;
  const { acknowledged_by } = req.body;

  if (!acknowledged_by) {
    return res.status(400).json({ error: 'acknowledged_by is required' });
  }

  try {
    const signal = db.prepare('SELECT * FROM signals WHERE id = ?').get(id);
    if (!signal) {
      return res.status(404).json({ error: 'Signal not found' });
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const update = db.prepare(
      "UPDATE signals SET status = 'acknowledged', acknowledged_by = ?, acknowledged_at = ? WHERE id = ?"
    );
    update.run(acknowledged_by.trim(), now, id);

    const updatedSignal = db.prepare('SELECT * FROM signals WHERE id = ?').get(id);

    console.log(`[SQL UPDATE] Signal ID #${id} acknowledged in SQLite DB by "${acknowledged_by.trim()}"`);

    // Broadcast "signal:acknowledged" event to room `circle:{circle_id}`
    io.to(`circle:${updatedSignal.circle_id}`).emit('signal:acknowledged', updatedSignal);

    res.json(updatedSignal);
  } catch (err) {
    console.error('Error acknowledging signal:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/circles/:id/signals — List recent signals for a circle
app.get('/api/circles/:id/signals', (req, res) => {
  const { id } = req.params;

  try {
    const circle = db.prepare('SELECT * FROM circles WHERE id = ?').get(id);
    if (!circle) {
      return res.status(404).json({ error: 'Circle not found' });
    }

    const signals = db.prepare('SELECT * FROM signals WHERE circle_id = ? ORDER BY created_at DESC, id DESC LIMIT 50').all(id);
    console.log(`[SQL QUERY] GET /api/circles/${id}/signals returning ${signals.length} signals from SQLite DB`);
    res.json(signals);
  } catch (err) {
    console.error('Error fetching signals:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fallback to index.html for SPA single page routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'public', 'index.html'));
});

// Socket.io connection handling & room management
io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`);

  // Support joining circle room: socket.emit('join_circle', { circle_id: 1, user_name: "Alice" })
  socket.on('join_circle', (data) => {
    const circle_id = typeof data === 'object' && data !== null ? Number(data.circle_id) : Number(data);
    const user_name = typeof data === 'object' && data !== null ? data.user_name : null;

    if (circle_id) {
      socket.circle_id = circle_id;
      socket.user_name = user_name;

      const room = `circle:${circle_id}`;
      socket.join(room);

      if (user_name) {
        if (!activeCircleSockets.has(circle_id)) {
          activeCircleSockets.set(circle_id, new Map());
        }
        activeCircleSockets.get(circle_id).set(socket.id, user_name);

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        try {
          db.prepare('UPDATE members SET last_seen = ? WHERE circle_id = ? AND name = ?').run(now, circle_id, user_name);
        } catch (e) {}
      }

      console.log(`Socket ${socket.id} (${user_name || 'Anon'}) joined room ${room}`);
      broadcastPresenceUpdate(circle_id);
    }
  });

  socket.on('disconnect', () => {
    console.log(`Socket disconnected: ${socket.id}`);
    if (socket.circle_id && socket.user_name) {
      const circleId = socket.circle_id;
      const userName = socket.user_name;
      const activeMap = activeCircleSockets.get(circleId);

      if (activeMap) {
        activeMap.delete(socket.id);
        if (activeMap.size === 0) {
          activeCircleSockets.delete(circleId);
        }
      }

      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      try {
        db.prepare('UPDATE members SET last_seen = ? WHERE circle_id = ? AND name = ?').run(now, circleId, userName);
      } catch (e) {}

      broadcastPresenceUpdate(circleId);
    }
  });
});

server.listen(port, '0.0.0.0', () => {
  console.log(`Lantern service running on port ${port}`);
});
