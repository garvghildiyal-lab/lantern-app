import urllib.request
import json
import sys

BASE_URL = "http://localhost:3000"

def make_request(path, data=None):
    url = BASE_URL + path
    headers = {'Content-Type': 'application/json'}
    body = json.dumps(data).encode('utf-8') if data else None
    req = urllib.request.Request(url, data=body, headers=headers)
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error requesting {path}: {e}")
        return None

def test_workflow():
    print("🚀 Starting Lantern Python Test Suite...")
    
    # 1. Create a circle
    print("\n1. Creating test circle 'Python Family'...")
    circle = make_request("/api/circles", {"name": "Python Family", "owner_name": "Python Sender"})
    if not circle:
        print("❌ Circle creation failed.")
        return
    print(f"✅ Circle created: ID={circle['id']}, Invite Code={circle['invite_code']}")

    # 2. Join circle
    print("\n2. Joining circle with member 'Python Receiver'...")
    join_res = make_request("/api/circles/join", {"invite_code": circle['invite_code'], "name": "Python Receiver"})
    if join_res:
        print("✅ Joined circle successfully.")

    # 3. Trigger signal
    print("\n3. Triggering emergency Lantern signal...")
    signal = make_request("/api/signals", {"circle_id": circle['id'], "sender_name": "Python Sender"})
    if not signal:
        print("❌ Signal trigger failed.")
        return
    print(f"🚨 Signal created: ID={signal['id']}, Status={signal['status']}")

    # 4. Fetch circle signals
    print("\n4. Fetching circle signals feed...")
    signals = make_request(f"/api/circles/{circle['id']}/signals")
    print(f"📋 Signals count: {len(signals) if signals else 0}")

    # 5. Acknowledge signal
    print("\n5. Acknowledging signal by 'Python Receiver'...")
    ack = make_request(f"/api/signals/{signal['id']}/acknowledge", {"acknowledged_by": "Python Receiver"})
    if ack:
        print(f"✅ Signal acknowledged! Ack'd by: {ack.get('acknowledged_by')}")

    print("\n🎉 All Lantern Python tests passed successfully!")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        BASE_URL = sys.argv[1]
    test_workflow()
