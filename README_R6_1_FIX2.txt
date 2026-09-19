NXT GEN PLANS R6.1 FIX2

WHY FIX1 FAILED
FIX1 searched for an exact text block. Your installed r6-1-integration.js had different formatting/line endings, so FIX1 correctly refused to modify it.

FIX2 uses structural markers instead of exact whitespace.
It removes the body-wide MutationObserver and adds direct TCP+/Road+ hooks.

MODIFIES ONLY
  r6-1-integration.js

BACKUP
  r6-1-integration.before_FIX2.js

INSTALL
1. Copy all files into the repo root.
2. Run APPLY_R6_1_FIX2.bat.
3. After PASS, completely close the NXT Gen Plans Edge window.
4. Relaunch with START_NXT_GEN_PLANS.bat.
5. Test TCP+ first.
