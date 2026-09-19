NXT GEN PLANS 0.1 R5 — ADVANCED TEMPORARY TRAFFIC-CONTROL DESIGN

BASELINE
Built additively against the current pushed and working R4.

NEW IN R5
- Multi-segment roadway drawing: click centerline points, double-click to finish.
- Roadway width from lanes + lane width + shoulders using calibrated page scale.
- Centerline and edge-line overlays.
- Pavement marking paths:
  dashed/solid/double white and yellow.
- Stop bar and traffic-flow arrow shortcuts.
- Work-zone area polygons:
  Work Area, Buffer, Activity Area, Advance Warning Area, Termination Area.
- Taper insertion using real-world length and lateral shift.
- Lane Mask and Road Mask polygons for non-destructive plan editing.
- Automatic Sign Legend from MUTCD signs on current sheet.
- North Arrow insertion.
- Optional grid snapping for roadway points.

INSTALL
Copy these files into the ROOT of the working repository:
  r5-addon.js
  r5-addon.css
  INSTALL_R5.js
  INSTALL_R5.bat
  VERIFY_R5_INSTALL.bat

Run INSTALL_R5.bat.
Then continue to launch using the existing working START_NXT_GEN_PLANS.bat.

ROLLBACK
A byte-for-byte index backup is created as:
  index.R4.before_R5.html
Restoring that file over index.html disables R5 without altering R3/R4 code.

NOT YET IN THIS PHASE
Automatic intersection generation, detailed turn-lane editor, print regions,
auto-template TCP generation, and smart sign-spacing rules are intentionally held
for the next acceptance-tested phase.
