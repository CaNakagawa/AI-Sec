# Security review findings and report contract

## Report language

Ask the user which language they want **before finalizing**. If already specified for this task, do not ask again. No language defaults: until answered, mark `REPORT_LANGUAGE_PENDING`. Localize human-facing prose and Markdown/PDF/issue drafts, but keep canonical JSON keys, stable IDs and assessment status values in their original form.

## Overall report

`SECURITY REVIEW — <generic project> — branch/commit <value or unknown>`

- Scope reviewed / exclusions / time and review mode:
- Architecture and trust boundaries:
- Attacker model:
- Verdict: `BLOCK | ACTION REQUIRED | NO BLOCKING FINDINGS OBSERVED`
- Findings: confirmed __ ; validation required __ ; not verifiable __
- Coverage: endpoint/handler counts where known; scope limitations
- Security strengths with references and evidence
- Recommended verification steps / owner decisions

## Finding (one per root cause)

```yaml
id: SEC-AUTHZ-001
status: CONFIRMED # or VALIDATION REQUIRED
severity: HIGH
confidence: HIGH
category: Authorization
component: api/items/[id]
file: src/example.ts
lines: "42-48"
summary: "Owner check missing on object retrieval"
source: "Authenticated request parameter 'id'"
missing_control: "Server-side ownership/tenant isolation"
sink: "Database lookup/response"
preconditions: "Authenticated non-owner; guessing a record id"
realistic_impact: "Cross-user read of private object"
evidence: "Sanitized code reference / test case; no secrets"
validation: "Source-confirmed; reproduction NOT RUN"
remediation: "Filter by authenticated principal or enforce DB policy"
verification_criteria: "Cross-user read and update denied; owner allowed"
```

Unknowns are not findings with inflated severity. A "NO BLOCKING FINDINGS OBSERVED" recommendation is scoped to actual reviewed coverage, not security certification.

## Report artifact policy

- Default: respond in chat; **do not modify the reviewed repository**.
- Only when explicitly requested and authorized, write sanitized artifacts to a separate output directory.
- Create canonical `findings.json` first, then derive `findings.md`, PDF, or issue draft from precisely that set.
- Never create/update external issues, upload reports, or publish repositories without explicit authorization.
