#!/usr/bin/env python3
"""Conservative example scanner orchestrator: no installs, no ZAP, aggregate output only.

SECURITY NOTE: CLI policy is not OS sandbox isolation. Run inside a separate
network-restricted, unprivileged sandbox with synthetic data and vetted tools.
"""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import tempfile

TOOL_NAMES = ("gitleaks", "semgrep", "osv")


def call(cmd: list[str], timeout: int, private_dir: Path) -> tuple[int | None, str, str]:
    env = os.environ.copy()
    env.pop("SEMGREP_APP_TOKEN", None)
    env.pop("OSV_API_KEY", None)
    env.pop("GITHUB_TOKEN", None)
    env.pop("GH_TOKEN", None)
    env["HOME"] = str(private_dir)
    env["XDG_CACHE_HOME"] = str(private_dir / "cache")
    env["XDG_CONFIG_HOME"] = str(private_dir / "config")
    try:
        r = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE,
                           text=True, errors="replace", timeout=timeout, env=env,
                           check=False)
        return r.returncode, r.stdout, r.stderr
    except subprocess.TimeoutExpired:
        return None, "", ""
    except OSError:
        return None, "", ""


def status_for(tool: str, project: Path, args: argparse.Namespace, tmp: Path) -> dict:
    result = {"tool": tool, "status": "NOT_RUN", "matches": None,
              "note": "Tool was not executed; no security conclusion."}
    binary = "osv-scanner" if tool == "osv" else tool
    if shutil.which(binary) is None:
        result["note"] = "Preinstalled binary unavailable. No automatic installation."
        return result

    report = tmp / (tool + ".json")
    if tool == "gitleaks":
        mode = "git" if args.gitleaks_history else "dir"
        if mode == "git" and not (project / ".git").exists():
            result["note"] = "Requested Git history scan but target is not a Git worktree root."
            return result
        cmd = [binary, mode, "--redact=100", "--report-format", "json",
               "--report-path", str(report), str(project)]
    elif tool == "semgrep":
        if args.semgrep_rules is None:
            result["note"] = "Approved local rule file required: --semgrep-rules."
            return result
        rules = args.semgrep_rules.resolve()
        if not rules.exists() or not rules.is_file():
            result["note"] = "Rules file unavailable; remote registry config is prohibited."
            return result
        cmd = [binary, "scan", "--metrics=off", "--config", str(rules),
               "--json", "--output", str(report), str(project)]
    else:
        if args.osv_online and not args.allow_network:
            result["note"] = "Online dependency lookup blocked; needs --allow-network."
            return result
        if args.osv_online:
            cmd = [binary, "scan", "-r", str(project), "--format=json"]
        else:
            cmd = [binary, "--offline", "--offline-vulnerabilities", "scan",
                   "-r", str(project), "--format=json"]

    # Never display raw tool output. Scanner stdout may include secrets or PII.
    rc, stdout, _stderr = call(cmd, args.timeout, tmp)
    if rc is None:
        result.update(status="ERROR", note="Scanner could not start or timed out; details withheld.")
        return result

    if tool in ("gitleaks", "semgrep"):
        try:
            data = json.loads(report.read_text(encoding="utf-8"))
            if tool == "gitleaks":
                if not isinstance(data, list):
                    raise ValueError("Unexpected Gitleaks JSON structure")
                matches = len(data)
            else:
                if not isinstance(data, dict) or not isinstance(data.get("results"), list):
                    raise ValueError("Unexpected Semgrep JSON structure")
                matches = len(data["results"])
        except (ValueError, OSError, UnicodeError):
            result.update(status="ERROR", note="No parseable scanner report; not a clean result.")
            return result
    else:
        try:
            data = json.loads(stdout)
            if not isinstance(data, dict) or not isinstance(data.get("results"), list):
                raise ValueError("Unexpected OSV-Scanner V2 JSON structure")
            matches = sum(len(p.get("vulnerabilities", []))
                          for group in data["results"]
                          if isinstance(group, dict)
                          for p in group.get("packages", [])
                          if isinstance(p, dict))
        except (ValueError, TypeError):
            result.update(status="ERROR", note="No parseable OSV V2 JSON report; not a clean result.")
            return result

    if rc not in (0, 1):
        result.update(status="ERROR", note=f"Scanner exited with status {rc}; not a clean result.")
        return result
    # Gitleaks and OSV may exit 1 on findings. Semgrep may exit 0 even with matches.
    result.update(status="CANDIDATE_FINDINGS" if matches else "NO_MATCHES_OBSERVED",
                  matches=matches,
                  note="Aggregate scanner observation only; review relevance and actual coverage.")
    return result


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--project", type=Path, required=True,
                    help="Path of owned, isolated, synthetic-data test repository")
    ap.add_argument("--tools", nargs="+", choices=TOOL_NAMES, default=["gitleaks", "semgrep"])
    ap.add_argument("--semgrep-rules", type=Path, help="Pre-reviewed local Semgrep rule file")
    ap.add_argument("--gitleaks-history", action="store_true", help="Scan local Git history (opt-in)")
    ap.add_argument("--osv-online", action="store_true", help="Allow online advisory mode")
    ap.add_argument("--allow-network", action="store_true", help="Explicit network disclosure approval (OSV only)")
    ap.add_argument("--timeout", type=int, default=180, help="Per-tool timeout seconds (default 180)")
    args = ap.parse_args(argv)
    project = args.project.resolve()
    if not project.is_dir():
        print(json.dumps({"status": "ERROR", "reason": "Project path must be an existing directory."}))
        return 2
    if args.timeout <= 0 or args.timeout > 3600:
        print(json.dumps({"status": "ERROR", "reason": "Timeout must be 1..3600 seconds."}))
        return 2
    if args.allow_network and not args.osv_online:
        print(json.dumps({"status": "ERROR", "reason": "Network flag only valid with --osv-online."}))
        return 2

    selected = list(dict.fromkeys(args.tools))
    results = []
    with tempfile.TemporaryDirectory(prefix="secure-vibe-scans-") as temp:
        tmp = Path(temp)
        for tool in selected:
            results.append(status_for(tool, project, args, tmp))
    # Deliberately omit tool stdout, stderr, file paths and raw match data.
    print(json.dumps({"project": "local project", "security_certified": False,
                      "results": results}, indent=2))
    # CI-aware exit codes: 0 = all selected tools ran and observed no matches;
    # 1 = candidate findings; 2 = at least one tool NOT RUN; 3 = execution ERROR.
    statuses = {r["status"] for r in results}
    if "ERROR" in statuses:
        return 3
    if "NOT_RUN" in statuses:
        return 2
    if "CANDIDATE_FINDINGS" in statuses:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
