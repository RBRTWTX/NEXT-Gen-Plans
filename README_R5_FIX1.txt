NXT GEN PLANS R5 FIX1 — TCP+ ROADWAY EVENT REPAIR

WHAT WAS WRONG
The pushed R5 multi-segment road tool used a click handler.

R3 has an earlier generic pointerdown drawing handler. Because r5RoadPath is
not one of R3's built-in tools, R3 treated that pointerdown as a generic box
markup and switched the tool back to Select before R5's click handler ran.

RESULT
TCP+ opened, but Draw Multi-Segment Road could not behave correctly.

FIX1
A capture-phase pointerdown guard now intercepts ONLY r5RoadPath pointerdowns
before the R3 generic drawing handler.

R5's existing click and double-click roadway code remains unchanged.

CURRENT GIT AUDIT
- main head checked: 6fd66018 ("r4 to r5")
- index.html loads:
    standards.js
    app.js
    r4-addon.js
    r5-addon.js
- r4-addon.js present
- r5-addon.js present
- r5-addon.css present
- index.R4.before_R5.html present
- dedicated-profile START_NXT_GEN_PLANS.bat present
- real MUTCD library: 1,054 SVG files + index.json
- obsolete R4 installers are removed

ROOT FILES THAT ARE NOW LEGACY / CLEANUP CANDIDATES
These are not causing R5 failure, but are no longer part of the active path:
- COPY_MUTCD_FROM_LOCAL_REPO.bat
- SYNC_REAL_MUTCD_ASSETS.ps1
- VERIFY_MUTCD_ASSETS.bat
- RESTORE_NXT_GEN_PLANS_R3_NOW.bat
- README_R4_FIXED_INSTALLER.txt

Keep the R3/R4/R5 backup HTML files until R5 is accepted.

INSTALL
Copy these files into the repo root:
- APPLY_R5_FIX1.js
- APPLY_R5_FIX1.bat
- VERIFY_R5_FIX1.bat

Run APPLY_R5_FIX1.bat.

Then launch with the existing START_NXT_GEN_PLANS.bat and test:
TCP+ -> Draw Multi-Segment Road -> click several roadway points -> double-click to finish.

The patch creates:
r5-addon.before_FIX1.js

No index.html modification is required.
