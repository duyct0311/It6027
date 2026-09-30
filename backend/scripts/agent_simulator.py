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

async def listen_server_commands(ws, agent_id: str):
    try:
        async for msg_str in ws:
            try:
                data = json.loads(msg_str)
                event = data.get("event")
                if event == "SYNC_IOC_RULES":
                    rule_info = data.get("data", {})
                    total = rule_info.get("total_rules", 0)
                    print(f"  ⚡⚡ [AGENT-{agent_id[:8]}] RECEIVED IOC RULES PUSH! Total Rules: {total:,}. Updating local detection engine...", flush=True)
                    # Send ACK back to server
                    ack_payload = {
                        "event": "ACK_IOC_SYNC",
                        "agent_id": agent_id,
                        "rules_count": total,
                        "status": "SUCCESS",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await ws.send(json.dumps(ack_payload))
                elif event == "SYNC_SCAN_MODE":
                    mode_info = data.get("data", {})
                    mode_name = mode_info.get("mode_name", "Unknown")
                    paths = mode_info.get("target_paths", [])
                    print(f"  🎯🎯 [AGENT-{agent_id[:8]}] RECEIVED SCAN MODE CONFIG PUSH! Mode: '{mode_name}' | Target Paths: {paths}. Updating local scan parameters...", flush=True)
                    # Send ACK back to server
                    ack_payload = {
                        "event": "ACK_SCAN_MODE_SYNC",
                        "agent_id": agent_id,
                        "mode_name": mode_name,
                        "status": "SUCCESS",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await ws.send(json.dumps(ack_payload))
                elif event == "COMMAND_IP_BLOCK":
                    rule_info = data.get("data", {})
                    ip_addr = rule_info.get("ip_address", "Unknown")
                    reason = rule_info.get("reason", "N/A")
                    cmd = rule_info.get("command", f'netsh advfirewall firewall add rule name="MalwareMgr_Block_{ip_addr}" dir=in action=block remoteip={ip_addr}')
                    rule_id = rule_info.get("rule_id", 0)
                    print(f"  🛑🛑 [AGENT-{agent_id[:8]}] RECEIVED COMMAND_IP_BLOCK!\n      -> Executing Windows Command: `{cmd}`\n      -> Reason: {reason}", flush=True)
                    # Send ACK back to server
                    ack_payload = {
                        "event": "ACK_IP_BLOCK",
                        "agent_id": agent_id,
                        "rule_id": rule_id,
                        "ip_address": ip_addr,
                        "action": "BLOCK",
                        "executed_command": cmd,
                        "status": "SUCCESS",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await ws.send(json.dumps(ack_payload))
                elif event == "COMMAND_IP_UNBLOCK":
                    rule_info = data.get("data", {})
                    ip_addr = rule_info.get("ip_address", "Unknown")
                    cmd = rule_info.get("command", f'netsh advfirewall firewall delete rule name="MalwareMgr_Block_{ip_addr}"')
                    rule_id = rule_info.get("rule_id", 0)
                    print(f"  🟢🟢 [AGENT-{agent_id[:8]}] RECEIVED COMMAND_IP_UNBLOCK!\n      -> Executing Windows Command: `{cmd}`", flush=True)
                    # Send ACK back to server
                    ack_payload = {
                        "event": "ACK_IP_UNBLOCK",
                        "agent_id": agent_id,
                        "rule_id": rule_id,
                        "ip_address": ip_addr,
                        "action": "UNBLOCK",
                        "executed_command": cmd,
                        "status": "SUCCESS",
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    }
                    await ws.send(json.dumps(ack_payload))

            except Exception as e:
                pass
    except Exception:
        pass

async def simulate_single_agent(server_uri: str, agent_id: str, interval: float = 2.0):
    url = f"{server_uri}?agent_id={agent_id}"
    print(f"[*] Starting agent simulator [{agent_id}] -> Connecting to {url}", flush=True)
    
    while True:
        try:
            async with websockets.connect(url) as ws:
                print(f"[+] Connected to WebSocket server as Agent: {agent_id}", flush=True)
                listener_task = asyncio.create_task(listen_server_commands(ws, agent_id))
                try:
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
                        print(f"[{agent_id[:8]}] Sent log: {threat_name} ({severity}) - {payload['Path']}", flush=True)
                        await asyncio.sleep(interval)
                finally:
                    listener_task.cancel()
        except Exception as e:
            print(f"[!] Agent [{agent_id[:8]}] Connection lost: {e}. Reconnecting in 3 seconds...", flush=True)
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
