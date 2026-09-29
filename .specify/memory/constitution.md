<!--
### Sync Impact Report
- **Version change**: Uninitialized (Template) → v1.0.0
- **List of modified principles**:
  - Defined Principle I: Security-First Architecture & Zero-Trust Agent Communication (mTLS, RBAC, Data Validation)
  - Defined Principle II: Safe Action Modes & Command Dispatch Integrity (Detection, Quarantine, Deletion, IP Block/Unblock)
  - Defined Principle III: Auditability & Immutable Scan/Threat Logs (Manual Scan Logs, Execution Timestamps, Per-File Results)
  - Defined Principle IV: Technology Stack & Architectural Separation (Python FastAPI Backend + React Web Frontend)
  - Defined Principle V: Test-Driven Security & Automated Verification (TDD, Static Code Analysis, Coverage Gates)
- **Added sections**:
  - Core System Capabilities & Technical Scope
  - Development Workflow & Governance Rules
- **Removed sections**: None
- **Templates requiring updates**:
  - `.specify/templates/plan-template.md` (✅ updated / aligned)
  - `.specify/templates/spec-template.md` (✅ updated / aligned)
  - `.specify/templates/tasks-template.md` (✅ updated / aligned)
- **Follow-up TODOs**: None
-->

# Malware Scan Agent Manager Constitution

## Core Principles

### I. Security-First Architecture & Zero-Trust Agent Communication
All system components MUST prioritize security over convenience. Communication between the Web Server and scanning Agents MUST enforce mutual TLS (mTLS) or cryptographically verified token-based authentication. Unauthenticated or untrusted connections MUST be terminated immediately. API endpoints exposed to the React web interface MUST enforce Role-Based Access Control (RBAC) and strict input validation (via Pydantic schemas in Python) to protect against Command Injection, Path Traversal, SQL Injection, and Cross-Site Scripting (XSS).

### II. Safe Action Modes & Command Dispatch Integrity
The system MUST support three explicit, deterministic scan action modes:
1. **Detection Only (Nhận diện & Cảnh báo)**: Inspect target scope and raise alerts without mutating candidate files.
2. **Quarantine (Cách ly)**: Safely isolate identified malicious files into a secure, encrypted storage path with roll-back metadata.
3. **Delete (Xóa)**: Permanently remove verified malware artifacts following strict authorization confirmation.

All outgoing commands to agents—including manual scan requests, schedule updates, IOC pushes, scan mode alterations, and IP blocking/unblocking directives—MUST be cryptographically signed and rate-limited to maintain command integrity and prevent spoofed or unauthorized execution.

### III. Auditability & Immutable Log Management
The system MUST maintain immutable audit logs for all security-relevant activities. This includes:
- **Manual & Scheduled Scan Logs**: Recording execution timestamp, target scan scope (directories/drives), agent ID, operator user ID, and granular per-file scan outcomes (file path, hash, detection status, action taken).
- **IOC Distribution Logs**: Tracking the deployment of file hashes (MD5/SHA256), YARA signatures, detection rules, and malicious IP/Domain threat lists down to agents.
- **Network Enforcement Logs**: Recording all IP blocking and unblocking command history, including target IP addresses, requesting operator, and agent execution acknowledgment.

Audit log entries MUST NOT be modifiable or deletable via web interfaces or standard application endpoints.

### IV. Technology Stack & Architectural Separation
The application architecture MUST strictly follow the technology stack guidelines:
- **Backend Framework**: Python (FastAPI/SQLAlchemy/Pydantic/Alembic) handling REST APIs for web frontend, agent orchestration, background scheduler (APScheduler/Celery), and security policy logic.
- **Frontend Framework**: React (Modern component-based design, secure state management, sanitized UI rendering, responsive interface for security operators).
- **Decoupled Architecture**: Clean separation between Administrative REST APIs (consumed by React UI) and Agent Protocol Endpoints (consumed by distributed Agents).

### V. Test-Driven Security & Automated Verification
Security mechanisms and core features MUST be verified through automated tests before deployment:
- Unit and integration tests MUST cover IOC signature parsing, scan mode state transitions, IP address validation, RBAC checks, and scheduler trigger logic.
- Static application security testing (SAST) tools (e.g. Bandit, Safety, ESLint security rules) MUST pass cleanly on every code revision.

## Core System Capabilities & Technical Scope

### 1. Manual & Scheduled Scan Management
- **Manual Scans**: Web users MUST be able to trigger immediate scans by specifying target agent(s) and filesystem scan scopes. Scan progress and per-file results MUST be logged in real time.
- **Scheduled Scans**: Web users MUST be able to define periodic scan schedules (cron expressions or interval timers). The backend MUST automatically issue scan instructions to targeted agents at scheduled times.

### 2. IOC Update & Distribution Engine
- **IOC Repository**: The system MUST store and manage threat indicators including file hashes (MD5, SHA256), YARA rules, threat signatures, and malicious IP/domain lists.
- **Agent Synchronization**: The backend MUST reliably push updated IOC payloads down to connected agents and verify receipt/activation status.

### 3. Network Barrier & IP Control
- **IP Blocking / Unblocking**: Security operators MUST be able to issue targeted network isolation commands (block IP / unblock IP) to agents. Agents MUST execute firewall/filtering updates locally and report status back to the Web Server.

## Development Workflow & Governance Rules

### 1. Code Review & Security Quality Gates
- Every pull request MUST pass automated unit/integration tests and security static analysis before merge.
- Any change affecting cryptographic keys, mTLS validation, IP blocking logic, or destructive scan modes (Quarantine/Delete) MUST require explicit peer review.

### 2. Secret & Data Management
- No API keys, database passwords, JWT secrets, or TLS private keys SHALL be committed to source repositories. All credentials MUST be injected via environment variables or secret vaults.

### 3. Amendment & Versioning Governance
- Amendments to this Constitution require documented justification, security review, and a semantic version bump (`MAJOR.MINOR.PATCH`).
- `MAJOR`: Backward incompatible architectural, governance, or security model changes.
- `MINOR`: Addition of new core capabilities or material principle expansions.
- `PATCH`: Wording clarifications, typo fixes, or non-semantic formatting updates.

**Version**: 1.0.0 | **Ratified**: 2026-09-29 | **Last Amended**: 2026-09-29
