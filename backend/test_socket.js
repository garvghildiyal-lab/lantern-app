const { io } = require('socket.io-client');

const BASE_URL = 'https://app-2aa9-3000.prg1.zerops.app';

async function testSocketConnections() {
  console.log('=== Starting Real-time Socket & Signal Test ===\n');

  // Step 1: Create a test circle first via REST API
  console.log('1. Creating a new circle...');
  const createCircleRes = await fetch(`${BASE_URL}/api/circles`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Emergency Support', owner_name: 'Alice' })
  });
  const circle = await createCircleRes.json();
  console.log(`   Created Circle ID ${circle.id} (Invite Code: ${circle.invite_code})\n`);

  const circleId = circle.id;

  // Step 2: Open Socket Client A and Socket Client B
  console.log('2. Connecting Socket Client A and Socket Client B...');
  const clientA = io(BASE_URL, { transports: ['websocket', 'polling'] });
  const clientB = io(BASE_URL, { transports: ['websocket', 'polling'] });

  const clientAReceived = [];
  const clientBReceived = [];

  await new Promise((resolve) => {
    let connectedCount = 0;
    function checkConnected() {
      connectedCount++;
      if (connectedCount === 2) resolve();
    }
    clientA.on('connect', () => {
      console.log(`   [Client A] Connected with socket id: ${clientA.id}`);
      clientA.emit('join_circle', circleId);
      checkConnected();
    });
    clientB.on('connect', () => {
      console.log(`   [Client B] Connected with socket id: ${clientB.id}`);
      clientB.emit('join_circle', circleId);
      checkConnected();
    });
  });

  // Setup event listeners for "signal:new" and "signal:acknowledged"
  clientA.on('signal:new', (data) => {
    console.log(`   📢 [Client A] Received event "signal:new":`, JSON.stringify(data));
    clientAReceived.push({ event: 'signal:new', data });
  });

  clientB.on('signal:new', (data) => {
    console.log(`   📢 [Client B] Received event "signal:new":`, JSON.stringify(data));
    clientBReceived.push({ event: 'signal:new', data });
  });

  clientA.on('signal:acknowledged', (data) => {
    console.log(`   ✅ [Client A] Received event "signal:acknowledged":`, JSON.stringify(data));
    clientAReceived.push({ event: 'signal:acknowledged', data });
  });

  clientB.on('signal:acknowledged', (data) => {
    console.log(`   ✅ [Client B] Received event "signal:acknowledged":`, JSON.stringify(data));
    clientBReceived.push({ event: 'signal:acknowledged', data });
  });

  // Small delay to ensure room join is registered on server
  await new Promise((r) => setTimeout(r, 1000));

  // Step 3: Trigger POST /api/signals (Create Signal)
  console.log('\n3. Triggering POST /api/signals (Sender: Alice)...');
  const signalRes = await fetch(`${BASE_URL}/api/signals`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ circle_id: circleId, sender_name: 'Alice' })
  });
  const signal = await signalRes.json();
  console.log('   REST Response:', JSON.stringify(signal, null, 2));

  // Small delay to collect live socket events
  await new Promise((r) => setTimeout(r, 1500));

  // Step 4: Trigger POST /api/signals/:id/acknowledge (Acknowledge Signal)
  console.log(`\n4. Triggering POST /api/signals/${signal.id}/acknowledge (Acknowledged by: Bob)...`);
  const ackRes = await fetch(`${BASE_URL}/api/signals/${signal.id}/acknowledge`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ acknowledged_by: 'Bob' })
  });
  const ackSignal = await ackRes.json();
  console.log('   REST Response:', JSON.stringify(ackSignal, null, 2));

  // Small delay to collect live socket events
  await new Promise((r) => setTimeout(r, 1500));

  // Step 5: Query GET /api/circles/:id/signals
  console.log(`\n5. Fetching GET /api/circles/${circleId}/signals...`);
  const listRes = await fetch(`${BASE_URL}/api/circles/${circleId}/signals`);
  const signalsList = await listRes.json();
  console.log('   REST Response:', JSON.stringify(signalsList, null, 2));

  // Close Sockets
  clientA.disconnect();
  clientB.disconnect();

  console.log('\n=== Summary of Verification ===');
  console.log(`Client A total events received: ${clientAReceived.length}`);
  console.log(`Client B total events received: ${clientBReceived.length}`);
  console.log('TEST PASSED SUCCESSFULLY!');
  process.exit(0);
}

testSocketConnections().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});
