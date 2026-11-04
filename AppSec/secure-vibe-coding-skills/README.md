# Secure Vibe Coding — Three Independent Skills

A public-ready, **generic** learning pack for AI-assisted software development. It is derived and adapted from two private user-supplied audit instructions (`security-reviewer-SKILL.md` and `ai_sec.md`), combined with practical secure-development and verification guidance. **No private project names, personal identity, domain names, internal infrastructure addresses, or deployment details are intentionally retained.**

## The three stages

| Stage | Skill | What it actually produces |
| --- | --- | --- |
| **Before code** | `01-secure-planner` | Threat-aware architecture outline, clear access rules, testable security requirements, negative-test plan, agent handoff prompt. |
| **Existing code** | `02-security-reviewer` | Independent *read-only* code/config review, evidence-based findings, scope/coverage, release-risk recommendation. |
| **Tests** | `03-security-tester` | Security test matrix, authorized synthetic/local tests, optional preinstalled Gitleaks/Semgrep/OSV scans, optional separately approved ZAP guidance. |

These are **instructions for coding agents, not a security product**. The AI that reads them must have relevant filesystem/execution capabilities, and any proposed shell command needs the user's authorization and a sandbox. A Markdown skill file does not independently enforce access controls or install tools. Different AI clients use different skill import paths; consult that client's documentation.

## Suggested workflow

1. Tell your coding agent: *"Use secure-planner to plan this task app before writing code; give me explicit owner-only rules and negative tests."*
2. Build the app through your normal coding workflow, using the agreed plan.
3. Tell an **independent reviewing agent**: *"Use security-reviewer to review this repo; do not modify anything and report confirmed findings versus required validation."*
4. In an **isolated local test environment** with synthetic accounts: *"Use security-tester to execute the owner/cross-user tests and approved local scanners; show evidence and all NOT RUN checks."*
5. Fix issues in a different task/agent, repeat tests, and have the reviewer reassess. None of these steps amounts to certification.

## Files

- Each skill lives in its own folder as `SKILL.md` with YAML frontmatter.
- Supporting templates/checklists are under `references/`.
- `03-security-tester/scripts/scan_local.py` is an **optional stdlib Python wrapper** for preinstalled approved tools. It never installs binaries or starts ZAP.
- To self-test the wrapper, run `python3 03-security-tester/scripts/test_scan_local.py`. This tests *orchestration safety behavior with fake scanners*, not real security detection.

## Report language selection (all three skills)

Before finalizing any of the three skills' human-readable deliverables, the agent asks **which language the user wants for the report**, unless the user already specified it for this task. Examples: Brazilian Portuguese, US English, German, Spanish, or any other selected language. Do **not** force Portuguese or assume the conversation language is the report language. If the preference is unknown, the skill marks `REPORT_LANGUAGE_PENDING` instead of generating a final narrative. Technical IDs, JSON field names, and test/assessment status tokens remain stable even when prose is translated. Scanner execution permission is a separate question from report-language selection.

## Defaults and security boundaries

- No automatic dependency installation, cloud upload, production scans, active attack, repository modifications, issue creation, or deploys.
- Never publish raw credentials, `.env`, real personal/health data or raw scanner output.
- For reports, preserve `CONFIRMED`, `VALIDATION REQUIRED`, `NOT APPLICABLE`, and `NOT VERIFIABLE` distinctions; a scanner match is only a candidate until contextual review.
- No scanner run implies the application is secure. Keep a record of executed tests, tested version and uncovered areas.
- Network restrictions and process isolation **must be enforced by the operator's environment**: the skill text and sample wrapper cannot guarantee containment.

## Tool links (official)

- Gitleaks: https://github.com/gitleaks/gitleaks
- Semgrep: https://semgrep.dev/docs/category/local-and-cli-scans/
- OSV-Scanner: https://google.github.io/osv-scanner/usage/
- OWASP ZAP: https://www.zaproxy.org/docs/docker/
- OWASP ASVS: https://owasp.org/www-project-application-security-verification-standard/
- NIST SSDF: https://csrc.nist.gov/pubs/sp/800/218/final

**Licensing note:** This package is included under the MIT License at the AI-Sec repository root. Review that license before redistributing the package. Documentation and tool usage should be periodically rechecked against installed versions.
