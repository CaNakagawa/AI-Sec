# Tooling reference — local, conservative defaults

**Prerequisite:** Tools and rule files are preinstalled, vetted, and approved. Run inside a network-restricted sandbox without production data or credentials. These commands are examples, not an implicit authorization to execute. CLI options vary by version; inspect local `--help` and pin versions before CI.

## 1. Gitleaks — secrets

For a pre-approved local working tree (Gitleaks 8.19+ command style):

```bash
gitleaks dir --redact=100 --report-format json --report-path /tmp/gitleaks-redacted.json /path/to/test-repo
```

For *authorized local* history review (may be more expensive and reveal previously committed secrets to the scanner process):

```bash
gitleaks git --redact=100 --report-format json --report-path /tmp/gitleaks-history-redacted.json /path/to/test-repo
```

Never paste the full JSON (it may include snippets and sensitive metadata) into a shared report. Validate actual secret class and privilege; public identifiers aren't necessarily credentials.

## 2. Semgrep Community Edition — static analysis

Local, **previously reviewed** rule file only, avoid automatic registry downloads:

```bash
semgrep scan --metrics=off --config /path/to/approved-rules.yml --json --output /tmp/semgrep.json /path/to/test-repo
```

`--config auto` retrieves a remote registry ruleset; **do not use it** when promising local-only behavior. A Semgrep alert is a candidate, not a confirmed exploit.

## 3. OSV-Scanner V2 — dependency advisories

In an isolated environment with vetted CLI and pre-cached offline vulnerability data (read local `--help`, as V1 differs):

```bash
osv-scanner --offline --offline-vulnerabilities scan -r /path/to/test-repo --format=json
```

If local databases are absent, record NOT RUN; do not silently fetch them. Remote advisory checks can reveal dependency metadata to providers; require explicit consent and network controls. A vulnerability advisory may not be reachable through your app's use of the library.

## 4. OWASP ZAP — HTTP testing (explicit permission required)

ZAP Baseline runs a spider and passive analysis, so it **does make HTTP requests** and can interact with stateful GET endpoints. Run only against an isolated service you own and explicitly approved; no production or third-party endpoints. If the local service is Docker-hosted, resolve access and network isolation before choosing container networking.

Illustrative *manual* command if ZAP is already installed and a local target is explicitly authorized:

```bash
zap-baseline.py -t http://127.0.0.1:8080 -m 1 -J /tmp/zap-redacted-review.json
```

Do **not** run full/active scan automatically. Raw ZAP results may include URLs, sessions, private paths, or other sensitive information: sanitize before sharing. Consider allowlisting routes and requiring a test-only environment.

## 5. Minimal runner

```bash
# Runs ONLY approved binaries already present on PATH; no installs.
python3 scripts/scan_local.py --project /path/to/test-repo --tools gitleaks semgrep --semgrep-rules /path/to/approved-rules.yml

# Dependency scan must be explicitly selected. Default behavior is offline.
python3 scripts/scan_local.py --project /path/to/test-repo --tools osv

# Opt-in remote advisory resolution only with permission for network disclosure.
python3 scripts/scan_local.py --project /path/to/test-repo --tools osv --osv-online --allow-network
```

The runner prints **aggregate JSON only**, with tool availability, findings count and execution status. It writes raw scanner outputs only to temporary private storage and deletes them after each run. It cannot itself enforce a kernel/network sandbox or verify ownership of a target: the operator must provide both. It intentionally does not invoke ZAP or execute application tests automatically.

## Reference docs (official)

- Gitleaks: https://github.com/gitleaks/gitleaks/blob/master/README.md
- Semgrep: https://semgrep.dev/docs/category/local-and-cli-scans/
- OSV-Scanner V2: https://google.github.io/osv-scanner/usage/
- OWASP ZAP Baseline: https://www.zaproxy.org/docs/docker/baseline-scan/
