# AI-Sec

A growing collection of practical resources for AI cybersecurity. **AppSec** is the first topic area; future areas can be added as separate sections, for example DataSec, ModelSec, and Network Security.

## AppSec

- [`AppSec/ai_sec.md`](AppSec/ai_sec.md) — comprehensive application security audit instructions, preserved byte-for-byte from the supplied file.
- [`AppSec/secure-vibe-coding-skills/`](AppSec/secure-vibe-coding-skills/README.md) — three focused skills: plan security before implementation, test in an authorized isolated environment, and independently review existing code. The package includes supporting references and an optional local scanner helper.

Suggested flow: plan requirements before implementation, test specific controls in an authorized local or staging environment, and use the reviewer for an evidence-based review. The audit prompt provides a broader review when needed.

Skills and prompts guide an AI assistant; they do not enforce technical permissions, isolate agents, or certify an application as secure. Enforce access boundaries in the application, infrastructure, and tools.

## Interactive labs

- [`labs/idor-lab/`](labs/idor-lab/README.md) — Cloudflare Worker + D1 IDOR laboratory for workshops. Each participant gets an isolated sandbox with fictional notes, plus vulnerable and protected authorization modes. Includes API tests and deployment instructions; intentionally **not** deployed automatically.

## Contributing

New topic areas should live in their own top-level directory and include a short README describing scope, references, and limitations. Keep examples synthetic and do not commit credentials, private notes, or production data.

## License

This repository is licensed under the MIT License. See [LICENSE](LICENSE).
