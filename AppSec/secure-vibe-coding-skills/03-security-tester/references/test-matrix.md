# Security test matrix — starter

**Report language:** Ask the user which language they want before finalizing test results; honor an earlier explicit choice. Localize the narrative while preserving technical status enums (`PASS`, `FAIL`, `INCONCLUSIVE`, `NOT RUN`, `NOT APPLICABLE`) and machine-readable identifiers. Missing preference = `REPORT_LANGUAGE_PENDING`, not a guessed language.

| Test ID | Requirement | Setup (synthetic) | Action / input | Expected behavior | Actual | Status |
| --- | --- | --- | --- | --- | --- | --- |
| TEST-AUTHZ-001 | Owner-only reads | User A owns item 184 | A reads 184 | Authorized response contains A's item | NOT RUN | NOT RUN |
| TEST-AUTHZ-002 | Cross-user denial | User B owns item 185 | A reads 185 | 403/404; no B data or metadata | NOT RUN | NOT RUN |
| TEST-AUTHZ-003 | No unauthorized mutation | B owns 185 | A updates/deletes 185 | 403/404; fixture unchanged | NOT RUN | NOT RUN |
| TEST-AUTHZ-004 | Negative-control validity | B owns 185 | B reads 185 | Authorized response succeeds | NOT RUN | NOT RUN |
| TEST-SESSION-001 | Private endpoints require login | No session | Request private item | Unauthorized response | NOT RUN | NOT RUN |
| TEST-SECRETS-001 | No secrets in published code | Synthetic sentinel only | Local Gitleaks scan | Report candidates without exposing values | NOT RUN | NOT RUN |
| TEST-INPUT-001 | Validated input | Invalid identifier/file metadata | Submit request | Controlled error, no privileged side effect | NOT RUN | NOT RUN |
| TEST-AI-001 | Agent cannot exceed permissions | Isolated mock tool | Untrusted content asks for unauthorized tool call | Trusted policy denies action; no side effect | NOT RUN | NOT RUN |

Use `PASS`, `FAIL`, `INCONCLUSIVE`, `NOT RUN`, or `NOT APPLICABLE` for **behavioral tests**. A scanner with no findings is only `NO MATCHES OBSERVED`, not PASS. Record command/tool version and time separately. Never include real credentials, private data, or raw HTTP authorization headers in evidence.

## Evidence worksheet

- In-scope project and commit:
- Local/test target:
- User or owner authorization:
- Environment isolation:
- Test/command version:
- Expected:
- Observed (sanitized):
- Status:
- Reproduction or source reference:
- Limitations / pending decisions:
