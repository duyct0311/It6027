# Requirements Quality Checklist: Hybrid IOC Engine & Public TI Feed Integration

**Purpose**: Unit tests for requirements quality, threat intelligence sync completeness, and manual IOC entry specification clarity.
**Created**: 2026-09-30
**Feature**: [spec.md](../spec.md) | [plan.md](../plan.md)

## Requirement Completeness

- [x] CHK001 - Are functional requirements specified for both automated public TI feed ingestion and manual custom IOC entry by Admin? [Completeness, Spec §FR-021, §FR-022]
- [x] CHK002 - Are mandatory attributes (`Value`, `Category`, `Source`, `Description`) explicitly required for every ingested IOC record? [Completeness, Spec §Key Entities]
- [x] CHK003 - Are supported public Threat Intelligence feed sources (`MalwareBazaar`, `ThreatFox`, `FeodoTracker`, `URLhaus`) explicitly enumerated? [Completeness, Spec §FR-021]
- [x] CHK004 - Are error handling and fallback requirements documented for TI feed provider downtime or HTTP errors? [Completeness, Spec §Edge Cases]
- [x] CHK005 - Are WebSocket broadcast requirements (`event = UPDATE_IOC`) specified when new IOC signatures are added or synced? [Completeness, Spec §FR-026]

## Requirement Clarity & Measurability

- [x] CHK006 - Is the maximum latency threshold for WebSocket IOC distribution down to connected Agents quantified with testable metrics? [Measurability, Spec §SC-009]
- [x] CHK007 - Is the performance threshold for batch TI feed ingestion and deduplication quantified under heavy load? [Measurability, Spec §SC-008]
- [x] CHK008 - Are valid IOC category values (`FileHash`, `MaliciousIP`, `YARA`, `URL`) unambiguously defined? [Clarity, Spec §FR-022]
- [x] CHK009 - Is the deduplication logic explicitly defined based on unique `(Value, Category)` comparison? [Clarity, Spec §FR-023]
- [x] CHK010 - Are manual sync API trigger requirements (`POST /api/v1/ioc/sync`) explicitly specified? [Clarity, Spec §FR-025]

## Requirement Consistency

- [x] CHK011 - Do IOC category types align consistently across spec requirements, REST API contracts, and database schema definitions? [Consistency, Spec §FR-022, Contracts §rest_api_schemas.json]
- [x] CHK012 - Are `Source` tag values consistent between automated public feed imports (`MalwareBazaar`, etc.) and manual entries (`Manual Admin`)? [Consistency, Spec §FR-022, §FR-024]
- [x] CHK013 - Do IOC broadcast payload structures match the WebSocket protocol contracts defined for agent communication? [Consistency, Contracts §agent_ws_protocol.json]

## Scenario & Edge Case Coverage

- [x] CHK014 - Are requirements specified for partial feed sync failure when one public provider is offline while others succeed? [Coverage, Spec §Edge Cases]
- [x] CHK015 - Are format validation requirements (e.g. SHA256 length, IP address syntax) specified for manual Admin IOC submissions? [Security Coverage, Spec §Edge Cases]
- [x] CHK016 - Are requirements defined for filtering IOC lists by both `Category` and `Source` on the web dashboard? [Coverage, Spec §FR-024]
- [x] CHK017 - Are requirements specified for updating `last_synced_at` timestamps on existing duplicate IOC records? [Coverage, Spec §Acceptance Scenarios]
- [x] CHK018 - Are graceful degradation requirements specified if public TI feed payloads contain malformed lines or invalid syntax? [Coverage, Spec §Edge Cases]

## Security & Governance Alignment

- [x] CHK019 - Are single Admin authorization requirements enforced for manual IOC creation, deletion, and manual feed sync triggers? [Security Alignment, Constitution Principle I, Spec §FR-007]
- [x] CHK020 - Is immutable audit tracking specified for all IOC feed sync events and manual Admin signature additions? [Governance Alignment, Constitution Principle III]
