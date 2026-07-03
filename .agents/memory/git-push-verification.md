---
name: Verify git push actually shipped the diff
description: A git push can exit successfully while the intended file changes still don't reach the remote branch that production deploys from — always confirm the file content on the remote, not just the push exit code.
---

In this project, the working repo has multiple remotes/histories in play (a
platform-managed local repo where task agents merge commits, plus a separate
GitHub remote that Railway/production actually deploys from). A `git push`
can report success and even show a real commit range advancing
(`abc123..def456`) while the diff that actually lands on the remote branch is
unrelated to the change you intended (e.g. only a screenshot asset, not the
source file you edited).

**Why:** Spent a full debugging cycle (multiple failed Railway token attempts,
user frustration) chasing a "why isn't production picking up my deploy"
problem that was actually "the code was never on GitHub to begin with" — the
earlier push silently shipped the wrong commit's diff.

**How to apply:** After any push that's supposed to ship a specific code
change to a remote used for production deploys, don't trust exit status
alone. Confirm by fetching the actual file content from the remote (e.g. via
the GitHub API `contents`/raw endpoint, or `git diff <remote-sha> -- <file>`)
and grep for a marker string/symbol you know is in the intended diff. Do this
BEFORE spending time debugging deployment/redeploy infrastructure (Railway
tokens, redeploy buttons, etc.) — infra is often not the problem.
