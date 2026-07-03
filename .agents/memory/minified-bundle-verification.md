---
name: Verifying a fix on minified frontend bundles
description: How to confirm a frontend code change actually reached a production JS bundle without wasting time on minifier archaeology.
---

Grepping a production/minified JS bundle for a source-level identifier (e.g.
a function or variable name from the diff) is unreliable: minifiers rename
local identifiers, and code may be split into multiple chunks where the
"main" entry file is actually a small shared-exports shim, not the page code
you expect.

**Why:** Spent time chasing a false negative — searching a prod bundle for a
renamed variable (`canUpdateStatus`) returned 0 matches even after the deploy
had genuinely succeeded, because minification stripped the name and the
"index-*.js" file turned out to be a tiny re-export chunk, not the app logic.

**How to apply:** When you need to confirm a frontend/backend fix is live in
production, prefer these signals, in order of reliability:
1. Functional end-to-end check: call the actual API endpoints the feature
   uses (e.g. login, then hit the mutating endpoint the new UI control would
   call) and confirm the behavior end-to-end.
2. Backend response shape changes (new/removed JSON fields) — these survive
   deploys verbatim and are trivial to `curl` and check.
3. Asset hash changes across ALL bundle chunks (not just one) as a proxy for
   "a fresh build happened," not proof of which commit built it.
4. Grepping for string literals (not identifiers) that appear in rendered UI
   text — these survive minification, unlike variable/function names.
Avoid relying solely on identifier grep in minified JS as your definitive check.
