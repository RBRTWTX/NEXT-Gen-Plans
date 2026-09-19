NXT GEN PLANS R6.1 FIX1 — TCP+ FREEZE REPAIR

CAUSE OF FREEZE
R6.1 installed a MutationObserver on the entire document body.

When TCP+ opened:
1. TCP+ palette was added.
2. The observer fired.
3. installTcpHealth() added/updated the health badge.
4. That badge DOM change fired the observer again.
5. The observer updated the badge again.
6. This could repeat indefinitely and freeze the browser UI.

FIX1
- completely removes the body-wide MutationObserver
- uses direct TCP+ button and Road+ button hooks instead
- health badge text is only changed when the message actually changes
- R3/R4/R5/R6 source files are untouched

INSTALL
Copy these files into the repo root:
- APPLY_R6_1_FIX1.js
- APPLY_R6_1_FIX1.bat
- VERIFY_R6_1_FIX1.bat

Run:
  APPLY_R6_1_FIX1.bat

Then CLOSE the currently frozen browser window completely.
Launch again with:
  START_NXT_GEN_PLANS.bat

BACKUP
The patch creates:
  r6-1-integration.before_FIX1.js

EMERGENCY ROLLBACK
DISABLE_R6_1.bat restores:
  index.R6.before_R6_1.html
over index.html.

That disables R6.1 while leaving R3/R4/R5/R6 intact.
