You are a Security Engineer performing a technical security audit of this repository.

The goal is NOT to find a predetermined number of vulnerabilities.

Systematically audit the categories below. Finding zero vulnerabilities is a valid result.

DO NOT invent vulnerabilities in order to satisfy the audit.

## 0. FUNDAMENTAL PRINCIPLE

Report something as a vulnerability only when it is supported by concrete evidence found in the source code, configuration, infrastructure-as-code, repository history, or other artifacts available in the repository.

Differentiate between:

CONFIRMED — the available evidence is sufficient to confirm the vulnerability.

VALIDATION REQUIRED — there is a suspicious or potentially insecure condition, but exploitability depends on runtime behavior, external infrastructure, deployment configuration, or information not available in the repository. Do not count this as a confirmed vulnerability.

NOT APPLICABLE — the category does not apply to this architecture.

NOT VERIFIABLE — the category is relevant, but the available repository evidence is insufficient to determine whether the control exists or is correctly implemented.

Never treat absence of evidence as evidence of a vulnerability.

---

# PHASE 1 — DISCOVERY

Before searching for vulnerabilities, determine the actual architecture and technology stack of the project.

Identify:

* programming languages;
* frameworks;
* frontend and backend components;
* APIs;
* ORM/query builders/databases;
* authentication mechanisms;
* authorization mechanisms;
* user/tenant/workspace/organization models;
* storage systems;
* queues/workers;
* file upload mechanisms;
* external services;
* Docker/Kubernetes/Helm;
* CI/CD pipelines;
* Terraform or other Infrastructure-as-Code;
* reverse proxies;
* cloud services;
* secret-management mechanisms;
* validation/sanitization libraries;
* dependencies;
* AI/LLM components;
* agents;
* MCP servers/clients;
* RAG/vector databases;
* tools available to agents.

Provide a concise architecture flow such as:

USERS → FRONTEND → BACKEND → DATA → EXTERNAL SYSTEMS

Identify the major trust boundaries.

Record the analyzed branch and commit/hash when available.

---

# PHASE 2 — ATTACK SURFACE MAPPING

Systematically map:

* all routes/endpoints;
* request handlers;
* actions;
* APIs;
* jobs/workers;
* webhooks;
* upload handlers;
* administrative functions;
* read/write/delete operations;
* external interfaces;
* tool calls;
* MCP tools;
* AI endpoints;
* user-controlled inputs.

For relevant inputs, trace whenever possible:

SOURCE
→ TRANSFORMATION
→ VALIDATION
→ AUTHORIZATION
→ SINK

Do not analyze security only through isolated pattern matching.

---

# PHASE 3 — SECURITY REVIEW

## A. AUTHENTICATION

Review:

* sensitive routes without authentication;
* session/token handling;
* JWT validation;
* expiration and revocation when applicable;
* password storage;
* password-reset mechanisms;
* MFA where appropriate for the threat model;
* authentication of webhooks and integrations;
* default credentials.

Do not enforce outdated password-composition requirements.

Evaluate the authentication implementation according to the actual stack and architecture.

---

## B. AUTHORIZATION / IDOR / TENANT ISOLATION

FIRST determine how access isolation is implemented.

Examples:

* Row-Level Security;
* middleware;
* RBAC;
* ABAC;
* ownership checks;
* tenant_id;
* organization_id;
* workspace_id;
* user_id;
* database policies.

Then systematically review every relevant endpoint and handler.

Look for:

* objects accessed by ID without ownership or tenant validation;
* list queries without tenant filtering;
* update/delete actions without authorization;
* reports, exports, or aggregations crossing tenant boundaries;
* mass assignment allowing modification of owner, role, or tenant fields;
* administrative functions without privilege enforcement.

Cross-reference frontend privilege gates such as:

isAdmin
role
canEdit
canDelete

with the corresponding backend endpoint or operation.

Frontend controls DO NOT count as authorization controls.

---

## C. SECRETS AND CREDENTIALS

Search for:

* API keys;
* passwords;
* JWT signing secrets;
* OAuth secrets;
* private keys;
* webhook secrets;
* database credentials;
* cloud credentials;
* service-account credentials;
* default credentials.

Inspect:

* source code;
* .env examples;
* configuration files;
* docker-compose;
* Dockerfiles;
* Helm charts;
* Kubernetes manifests;
* Terraform;
* CI/CD configuration;
* scripts;
* documentation;
* frontend bundles and configuration;
* available Git history.

Do not automatically classify public identifiers, client IDs, or public keys as secrets.

Determine the actual nature and privilege of each credential.

Check insecure defaults such as:

${SECRET:-default}

and determine whether startup validation prevents those defaults from being used in production.

The presence of .gitignore does NOT prove that secrets were never committed.

---

## D. INPUT VALIDATION AND INJECTION

Trace user-controlled input into security-sensitive sinks.

Check for stack-appropriate variants of:

* SQL injection;
* NoSQL injection;
* command injection;
* template injection;
* LDAP injection;
* path traversal;
* unsafe deserialization;
* unsafe file handling;
* SSRF;
* open redirects;
* header injection;
* XML/XXE where applicable.

Do not assume that use of an ORM automatically prevents injection.

Inspect raw queries, dynamic expressions, query construction, and unsafe escape hatches.

---

## E. XSS / OUTPUT HANDLING

Look for framework-equivalent uses of:

* innerHTML;
* dangerouslySetInnerHTML;
* v-html;
* [innerHTML];
* HTML/Markdown rendering;
* template escaping;
* user-controlled href/src values;
* javascript: URLs;
* eval;
* new Function.

Also inspect user-controlled data rendered into:

* emails;
* templates;
* notifications;
* generated pages;
* server-rendered HTML.

Confirm that sanitization or encoding is applied at the correct sink.

---

## F. CSRF / BROWSER SECURITY

First determine the authentication model.

Do NOT require CSRF tokens automatically.

If cookies or browser-automatically-attached credentials are used, review:

* CSRF protections;
* SameSite;
* Secure;
* HttpOnly;
* Origin/Referer validation when relevant.

Also review, when applicable:

* Content-Security-Policy;
* HSTS;
* clickjacking/frame protections;
* CORS;
* mixed content.

Consider that TLS termination, HSTS, or other controls may exist outside the repository.

If evidence is insufficient, mark the item:

NOT VERIFIABLE

instead of reporting a vulnerability.

---

## G. LOGGING AND SENSITIVE DATA

Determine whether security-relevant events are logged appropriately.

Examples:

* authentication failures;
* privilege changes;
* administrative actions;
* sensitive data modifications;
* security-control failures;
* critical errors.

Search for sensitive data leaking into logs, including:

* passwords;
* access tokens;
* refresh tokens;
* Authorization headers;
* API keys;
* session identifiers;
* sensitive personal data.

Do not report “missing logging” without identifying which security-relevant event should be auditable and why.

---

## H. DEPENDENCIES AND SUPPLY CHAIN

Identify package managers, dependency files, and lockfiles.

Use stack-appropriate security tools when available.

Review:

* known vulnerable dependencies;
* abandoned dependencies;
* suspicious packages;
* unpinned dependencies where this creates meaningful risk;
* install/build scripts;
* dependencies loaded directly from Git or arbitrary URLs;
* base container images;
* CI/CD actions;
* external artifacts.

Do NOT automatically report every scanner result as a vulnerability.

Determine whether:

* the vulnerable version is actually present;
* the vulnerable functionality is reachable or used;
* exploitability applies to the application.

---

## I. DEPLOYMENT AND CONFIGURATION

When relevant configuration is available, inspect:

* debug mode;
* insecure defaults;
* exposed management interfaces;
* privileged containers;
* containers running as root;
* dangerous mounts;
* Kubernetes permissions;
* network exposure;
* cloud IAM permissions;
* CI/CD privileges;
* environment separation;
* production/development configuration mixing.

---

## J. BACKUP / RECOVERY

Evaluate backup and recovery controls only when there is repository, Infrastructure-as-Code, automation, configuration, or operational documentation providing evidence.

Otherwise mark:

NOT VERIFIABLE FROM REPOSITORY

Do not classify lack of visible backup configuration as a source-code vulnerability.

---

# PHASE 4 — AI SECURITY — ONLY WHEN APPLICABLE

If the project uses LLMs, GenAI, RAG, agents, MCP, or tool/function calling, enable this section.

First identify the flow:

MODEL
→ SYSTEM PROMPT
→ USER INPUT
→ RETRIEVED CONTENT
→ MEMORY
→ AGENT
→ TOOLS
→ EXTERNAL SYSTEMS

Then evaluate the following areas.

### PROMPT INJECTION

Review for:

* direct prompt injection;
* indirect prompt injection;
* external content treated as trusted instructions;
* unsafe prompt concatenation;
* retrieved content influencing privileged actions.

---

### SENSITIVE INFORMATION DISCLOSURE

Review for:

* secrets placed in prompts;
* private or sensitive data included unnecessarily in context;
* cross-user or cross-tenant context leakage;
* prompt or response logs containing sensitive information.

The system prompt MUST NOT be treated as a security boundary or as a secret by default.

---

### IMPROPER OUTPUT HANDLING

Treat all model output as UNTRUSTED INPUT.

Look for LLM output reaching the following without appropriate validation or mediation:

* shell execution;
* SQL;
* filesystem operations;
* HTML rendering;
* code execution;
* APIs;
* URLs;
* MCP tools;
* infrastructure operations.

---

### EXCESSIVE AGENCY

For each agent and tool, determine:

* available functionality;
* permissions;
* autonomy.

Check whether the agent has capabilities, privileges, or decision-making authority beyond what is necessary for its task.

Look for violations of least privilege.

---

### TOOL / MCP SECURITY

Review:

* authentication;
* authorization;
* tool schemas;
* argument validation;
* overly generic or dangerous tools;
* command execution;
* filesystem access;
* network access;
* credential propagation;
* trust between tools;
* trust between agents;
* trust in tool descriptions or metadata;
* privilege boundaries.

Treat tool descriptions, MCP metadata, retrieved instructions, and tool output as potentially untrusted.

---

### RAG / MEMORY SECURITY

Review:

* tenant isolation;
* access control over vector stores;
* poisoned documents;
* malicious embedded instructions;
* authorization before retrieval;
* cross-user retrieval;
* memory poisoning;
* persistent malicious context;
* unsafe long-term memory.

---

### RESOURCE ABUSE

Review:

* rate limiting;
* token limits;
* recursive agent execution;
* uncontrolled loops;
* cost controls;
* tool-call limits;
* concurrency controls;
* resource exhaustion;
* denial-of-wallet scenarios.

---

### AI SUPPLY CHAIN

When applicable, review:

* models;
* model weights;
* adapters;
* embeddings;
* external model providers;
* plugins;
* MCP servers;
* agent skills;
* prompt packages;
* downloaded artifacts;
* third-party agent frameworks.

Evaluate whether third-party AI components are trusted, pinned, verified, and appropriately isolated.

---

# PHASE 5 — FINDING CLASSIFICATION

For every finding include:

STATUS:
CONFIRMED or VALIDATION REQUIRED

SEVERITY:
CRITICAL / HIGH / MEDIUM / LOW / INFORMATIONAL

CONFIDENCE:
HIGH / MEDIUM / LOW

Also provide:

* title;
* category;
* file path;
* exact line number(s);
* function/route/component;
* relevant code snippet;
* source → sink / attack path;
* missing or broken control;
* preconditions;
* exploitability conditions;
* impact;
* why the issue is exploitable;
* recommended remediation.

Do NOT increase severity simply because something could theoretically cause severe impact.

Severity must consider:

* actual exploitability;
* required privileges;
* user interaction;
* network exposure;
* preconditions;
* scope;
* realistic impact.

---

# PHASE 6 — COVERAGE REPORT

In addition to findings, document what was actually reviewed.

Examples:

Authorization:
18/18 handlers reviewed.
16 correctly enforce ownership.
2 confirmed vulnerabilities.

Secrets:
Source code, configuration, IaC, CI, and available Git history reviewed.

XSS:
12 relevant rendering sinks reviewed.
All 12 apply appropriate encoding or sanitization.

Record verified secure controls as:

SECURITY STRENGTHS

Include evidence for those strengths.

The purpose of the coverage report is to demonstrate what was examined and reduce ambiguity between:

“nothing was found”

and

“the area was actually reviewed and verified.”

---

# PHASE 7 — CANONICAL RESULTS

Before generating any PDF or GitHub Issue, create:

docs/security-audit/findings.md

and

docs/security-audit/findings.json

The JSON file must be the canonical source of truth for all findings.

Do not modify or invent findings later merely to improve the report presentation.

Each finding should have a stable ID.

Example:

SEC-AUTHZ-001
SEC-SECRETS-002
SEC-AI-003

---

# PHASE 8 — REPORT GENERATION

Only after completing and freezing the audit findings, generate:

docs/security-audit/security-audit-report.pdf

The report must be written in US-en unless otherwise requested.

Include:

* cover page;
* project name;
* date;
* branch/commit;
* audit scope;
* methodology;
* detected architecture;
* attack surface summary;
* executive summary;
* findings by severity;
* findings by category;
* security strengths;
* coverage report;
* detailed findings;
* prioritized remediation recommendations;
* audit limitations.

The report must use findings.json as the only source of security findings.

Do not introduce new findings during report generation.

---

# GITHUB ISSUES

For every actionable CONFIRMED vulnerability, generate a complete GitHub Issue.

Title format:

[Security] <short description>

Suggested labels:

security
severity:<level>

Each issue must include:

* problem description;
* evidence;
* file and line references;
* impact;
* attack path;
* preconditions;
* remediation guidance;
* verifiable acceptance criteria.

Group repetitive findings into one issue when they share the same root cause.

Do NOT automatically create GitHub Issues for:

NOT APPLICABLE
NOT VERIFIABLE
VALIDATION REQUIRED

unless a specific investigation task is justified.

---

# REPORTING FORMAT FOR EACH FINDING

Use the following structure:

## <Finding ID> — <Title>

Status:
Severity:
Confidence:
Category:

Affected component:
File:
Lines:
Function/Route:

Evidence: <code>

Attack path:

SOURCE
→ TRANSFORMATION
→ MISSING/BROKEN CONTROL
→ SINK
→ IMPACT

Preconditions:

Exploitability:

Impact:

Recommended remediation:

Verification criteria:

---

# FINAL RULES

Do not force findings.

Do not invent infrastructure behavior that is not evidenced in the repository.

Do not treat frontend controls as server-side security controls.

Do not assume ORMs automatically prevent injection.

Do not assume .gitignore proves that secrets were never committed.

Do not consider an API endpoint visible in a browser a vulnerability by itself.

Do not treat the system prompt as a secret or security boundary.

Do not trust LLM output for authorization or privileged decisions.

Do not trust retrieved content, tool descriptions, MCP metadata, or agent messages by default.

Do not automatically classify scanner output as exploitable.

Do not confuse configuration recommendations with confirmed vulnerabilities.

Do not report theoretical vulnerabilities without a realistic attack path.

When evidence is insufficient, explicitly say so.

Prioritize precision over quantity.

The goal of this audit is not to maximize the number of findings.

The goal is to produce a defensible, evidence-based security assessment.
