#!/usr/bin/env python3
"""Self-test of wrapper behavior using fake local scanners, not a real security scan."""
import json
from pathlib import Path
import os
import subprocess
import sys
import tempfile
import unittest

SCRIPT = Path(__file__).with_name("scan_local.py")


class WrapperTests(unittest.TestCase):
    def test_safe_redaction_and_exit_handling(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t)
            (p / "repo").mkdir()
            (p / "bin").mkdir()
            fake = p / "bin" / "gitleaks"
            fake.write_text('''#!/usr/bin/env python3
import json,sys
from pathlib import Path
args = sys.argv
out = Path(args[args.index('--report-path')+1])
out.write_text(json.dumps([{'Secret': 'synthetic-top-secret', 'RuleID': 'fake-rule'}]))
print('synthetic-top-secret MUST NOT APPEAR IN WRAPPER OUTPUT')
sys.exit(1)
''')
            fake.chmod(0o755)
            env = os.environ.copy()
            env["PATH"] = str(p / "bin") + os.pathsep + env["PATH"]
            proc = subprocess.run([sys.executable, str(SCRIPT), "--project", str(p / "repo"),
                                   "--tools", "gitleaks"], capture_output=True, text=True,
                                  env=env, timeout=15)
            self.assertEqual(proc.returncode, 1)
            self.assertNotIn("synthetic-top-secret", proc.stdout + proc.stderr)
            parsed = json.loads(proc.stdout)
            self.assertFalse(parsed["security_certified"])
            self.assertEqual(parsed["results"][0]["status"], "CANDIDATE_FINDINGS")
            self.assertEqual(parsed["results"][0]["matches"], 1)

    def test_semgrep_without_local_rules_is_not_run(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t)
            (p / "bin").mkdir()
            fake = p / "bin" / "semgrep"
            fake.write_text("#!/bin/sh\necho 'THIS SHOULD NEVER RUN'\nexit 3\n")
            fake.chmod(0o755)
            env = os.environ.copy()
            env["PATH"] = str(p / "bin") + os.pathsep + env["PATH"]
            proc = subprocess.run([sys.executable, str(SCRIPT), "--project", t,
                                   "--tools", "semgrep"], capture_output=True, text=True,
                                  env=env, timeout=15)
            self.assertEqual(proc.returncode, 2)
            self.assertNotIn("THIS SHOULD NEVER RUN", proc.stdout)
            self.assertEqual(json.loads(proc.stdout)["results"][0]["status"], "NOT_RUN")

    def test_osv_online_requires_explicit_network_approval(self):
        with tempfile.TemporaryDirectory() as t:
            p = Path(t)
            (p / "bin").mkdir()
            fake = p / "bin" / "osv-scanner"
            fake.write_text("#!/bin/sh\necho 'unexpected run'\nexit 3\n")
            fake.chmod(0o755)
            env = os.environ.copy()
            env["PATH"] = str(p / "bin") + os.pathsep + env["PATH"]
            proc = subprocess.run([sys.executable, str(SCRIPT), "--project", t,
                                   "--tools", "osv", "--osv-online"], capture_output=True,
                                  text=True, env=env, timeout=15)
            self.assertEqual(proc.returncode, 2)
            self.assertNotIn("unexpected run", proc.stdout)
            self.assertEqual(json.loads(proc.stdout)["results"][0]["status"], "NOT_RUN")


if __name__ == "__main__":
    unittest.main()
