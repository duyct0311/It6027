import asyncio
import json
import random
import uuid
from datetime import datetime, timezone
import websockets

MODULES = ["AI", "YARA", "Hash", "Behavioral", "Heuristic"]
THREATS = [
    ("AI-Detected Malware", "High"),
    ("Trojan.Win32.Generic", "Critical"),
    ("Ransom.WannaCry.Variant", "Critical"),
    ("Adware.Win32.PUP", "Low"),
    ("Spyware.Agent.Keylogger", "High"),
    ("Suspicious.DLL.Injection", "Medium")
]
SCAN_TYPES = ["Realtime Protection", "Manual Scan", "Scheduled Scan"]
STATUSES = ["DETECTED_ONLY", "QUARANTINED", "DELETED"]
PATHS = [
    r"C:\Users\tienl\Downloads\build_x86\dll_test.exe",
    r"C:\Windows\Temp\malicious_payload.dll",
    r"C:\ProgramData\SystemHelper.exe",
    r"D:\Projects\Test\suspicious_script.vbs",
    r"C:\Users\Admin\AppData\Local\Temp\crypto_miner.exe"
]

async def simulate_single_agent(server_uri: str, agent_id: str, interval: float = 2.0):
    url = f"{server_uri}?agent_id={agent_id}"
    print(f"[*] Starting agent simulator [{agent_id}] -> Connecting to {url}")
    
    while True:
        try:
            async with websockets.connect(url) as ws:
                print(f"[+] Connected to WebSocket server as Agent: {agent_id}")
                while True:
                    threat_name, severity = random.choice(THREATS)
                    payload = {
                        "AgentID": agent_id,
                        "Module": random.choice(MODULES),
                        "Name": threat_name,
                        "Path": random.choice(PATHS),
                        "ScanType": random.choice(SCAN_TYPES),
                        "Severity": severity,
                        "Status": random.choice(STATUSES),
                        "Time": datetime.now(timezone.utc).isoformat(),
                        "version": "1.0"
                    }
                    await ws.send(json.dumps(payload))
                    print(f"[{agent_id[:8]}] Sent log: {threat_name} ({severity}) - {payload['Path']}")
                    await asyncio.sleep(interval)
        except Exception as e:
            print(f"[!] Agent [{agent_id[:8]}] Connection lost: {e}. Reconnecting in 3 seconds...")
            await asyncio.sleep(3)

async def main():
    import argparse
    parser = argparse.ArgumentParser(description="Simulate malware scanning agents")
    parser.add_argument("--agents", type=int, default=3, help="Number of concurrent simulated agents")
    parser.add_argument("--interval", type=float, default=2.5, help="Interval between log events (seconds)")
    parser.add_argument("--url", type=str, default="ws://localhost:8000/ws/agent", help="WebSocket server URL")
    args = parser.parse_args()

    agent_ids = [str(uuid.uuid4()) for _ in range(args.agents)]
    print(f"=== Starting Malware Agent Simulator ===")
    print(f"Agents count: {args.agents}")
    print(f"Target Server: {args.url}\n")

    tasks = [simulate_single_agent(args.url, aid, args.interval) for aid in agent_ids]
    await asyncio.gather(*tasks)

if __name__ == "__main__":
    asyncio.run(main())
