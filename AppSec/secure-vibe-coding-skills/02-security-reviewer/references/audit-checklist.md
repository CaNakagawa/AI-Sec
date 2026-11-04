# Evidence-first security review checklist

For each relevant section, record **CONFIRMED**, **VALIDATION REQUIRED**, **NOT APPLICABLE**, **NOT VERIFIABLE**, or `reviewed — no issue observed`, with scope and supporting evidence. A checklist is not an automatic vulnerability list.

## 1 — Identity and access
- Identify auth model (cookies, bearer tokens, third-party identity provider, anonymous use); validate sensitive routes and reset/revocation mechanisms as applicable.
- Trace session checks on **server**; inspect token validation, expiration, revocation, and appropriate MFA.
- Establish the *actual isolation mechanism*: RLS, policies, middleware, ownership, RBAC/ABAC, tenant/workspace ID. Check list/detail/update/delete/export/admin paths; don't trust client-submitted ownership/role. Verify RLS policies and privileged service keys if using a database that supports them.
- Check mass-assignment of `owner`, `role`, `organization`, or `tenant` fields and cross-tenant queries/exports.

## 2 — Untrusted inputs and sinks
- Trace SQL/NoSQL, shell, templating, LDAP, path traversal, file uploads, unsafe deserialization, SSRF/redirects, XXE/XML where relevant.
- Review raw queries and dynamic query construction even with an ORM.
- Inspect HTML/Markdown/email/template rendering and all dangerous sinks: `innerHTML`, `dangerouslySetInnerHTML`, `v-html`, `eval`, URL schemes, etc.; verify contextual output encoding.
- Account for browser authentication model before labeling CSRF; consider cookie attributes, Origin/Referer enforcement, CORS, CSP and frame protection where applicable.

## 3 — Secrets, data protection, and observability
- Review source, build artifacts, frontend bundles, IaC, CI, Docker/Kubernetes files, and *available Git history* for genuinely private credentials. Never print raw values.
- Distinguish intentionally public API identifiers and client/public keys from privileged credentials.
- Review logs for token/header/session/private data leakage; confirm which security events should be auditable rather than reporting generic missing logs.
- Review personal data minimization, retention, deletion/export, consent and privacy boundaries where relevant.

## 4 — Supply chain and operations
- Check manifest/lockfile agreement, known risky versions, executable install scripts, CI actions, images, unsigned updates, dependency sources, and least privilege. Confirm advisory applies to installed version and reachable functionality before calling vulnerability confirmed.
- Review debug/test configuration in deploy, IAM, container root, dangerous mounts, open management surfaces, CI secrets, environment separation, rate limiting and AI cost controls.
- Assess backups/recovery only when actual IaC/config/runbooks exist; unknown external backups are NOT VERIFIABLE, not a source vulnerability.
- For device/firmware: OTA signing, default passwords, network exposure, path restraints, and serial/debug surfaces as appropriate.

## 5 — AI/LLM/agent systems (enable only if present)
- Identify prompt/context path: user input → retrieved documents → memory → LLM → agent → tools → external systems.
- Test threat hypotheses: direct/indirect prompt injection; poisoned RAG/memory; cross-user retrieval; privileged tool calls; unsafe model outputs reaching SQL, shell, HTML, file, network or APIs.
- Confirm server-side authorization before data retrieval and every tool action. A system prompt is neither a security boundary nor inherently secret.
- Examine MCP tool argument validation, descriptions as untrusted metadata, agent-to-agent trust and credential propagation.
- Check agent autonomy, tool/function permissions, budgets, recursion/concurrency caps and denial-of-wallet scenarios.
- Check model weights, prompt packages, skills, plugins and externally sourced AI components for supply-chain risk.

## 6 — Evidence rules
- A suspicious regex match by itself is not a confirmed exploitable issue.
- The absence of relevant source code may be an environment visibility limit, not a defect.
- Separate validated findings from hypotheses and document reviewed denominator and gaps.
- Do not include raw secrets, patient data, or unreleased internal infrastructure details in output.
