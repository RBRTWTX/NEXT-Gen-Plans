NXT GEN PLANS 0.1 R8
COMBINED MANUAL INTERSECTION + PRODUCTION PACKAGE

BUILT AGAINST CURRENT PUSHED GIT
  87121884 — Installed R7

VERIFIED BASELINE
- app.js / R3 retained
- R4 retained
- R5 / TCP+ retained
- R6 / Road+ retained
- R6.1 FIX2 retained
- R7 Manual TCP retained
- 1,054 MUTCD SVG files remain in Git
- no body-wide MutationObserver is introduced

IMPORTANT
R8 remains MANUAL.

R8 DOES NOT:
- generate a TCP layout
- pick signs
- calculate taper lengths
- calculate device spacing
- choose station text
- choose intersection geometry
- populate schedules from the plan automatically

R8 FEATURES

1. MANUAL INTERSECTION DETAILS
- drag stop bar
- drag direction arrow
- drag crosswalk
- drag median / island
- three-click quadratic curb return / curve

These are user-drawn objects on a dedicated Intersection Details layer.

2. MANUAL ROAD STATION LABELS
- choose an existing road
- enter your own station text
- enter your own offset
- click the exact position on the road
- label remains road-relative if the road is reshaped

No station numbering is generated.

3. USER-MADE MANUAL TEMPLATES
- check any eligible objects on the current sheet
- save the checked group under your own name
- click Place
- click an insertion point

Templates are stored in the dedicated NXT browser profile via localStorage.
Road objects, R7 road attachments, intersection objects and road-relative station
labels are intentionally excluded from template capture so saved templates do not
contain broken road references.

4. MANUAL SCHEDULE / LEGEND
- user enters title
- user enters each row manually
- R8 inserts an editable monospaced note/table

Nothing is counted automatically.

5. PRINT REGIONS
- user names and draws a rectangular print-region guide
- print guides live on their own layer
- Fit Selected Region zooms the workspace to that guide
- hide the Print Regions layer before final PDF export if guides should not print

6. SHEET MANAGER
- see all current pages
- manually assign sheet number
- manually assign sheet title
- open a sheet
- move current sheet up/down
- duplicate current sheet

Existing R3 page/PDF behavior remains the underlying page system.

LAYERS ADDED
- Intersection Details
- Sheet Production
- Print Regions

Existing R6.1 layers remain untouched:
- Roadways
- Permanent Pavement Markings
- Traffic Signs
- Traffic Devices
- Work Zones / Areas
- Temporary Striping / Tapers

COMPATIBILITY

R3
- PDF opening unchanged
- ordinary markup tools unchanged
- save/load unchanged
- flattened PDF export unchanged
- R8 graphics render into the existing SVG markup layer and therefore export

R4
- plan creation and scale remain unchanged

R5 / TCP+
- R8 adds no handler for r5RoadPath
- TCP+ implementation is untouched

R6 / Road+
- R8 does not replace road rendering/editing
- R8 road station labels only read road geometry

R6.1 FIX2
- hard layer locks remain in force
- no MutationObserver is added
- locked R8 objects honor isMarkupLocked in R8-specific editing controls

R7
- R7 Manual TCP remains independent
- R8 templates intentionally exclude R7 road-attached objects
- R8 does not alter r7PickRange or R7 rendering

SAVE / LOAD
R8 sheet metadata and R8 markup objects are stored because existing NXP saves
serialize the pages and markups directly.

Manual template library is browser-profile localStorage and is separate from the NXP file.

PDF EXPORT
Visible R8 objects are part of the SVG markup layer and are included in the
existing flattened PDF export. Hide Print Regions before final export when desired.

INSTALL
Copy to the project root:
  r8-addon.js
  r8-addon.css
  INSTALL_R8.js
  INSTALL_R8.bat
  VERIFY_R8_INSTALL.bat
  DISABLE_R8.bat
  README_R8.txt

Run:
  INSTALL_R8.bat

Then launch normally:
  START_NXT_GEN_PLANS.bat

Installer creates:
  index.R7.before_R8.html

ACCEPTANCE TEST ORDER

CURRENT FEATURES FIRST
1. Launch.
2. Open TCP+ and confirm it does not freeze.
3. Draw an R5 multi-segment road.
4. Open Road+ and verify road editing/curves.
5. Open Manual TCP and verify an R7 device run.
6. Open Traffic and verify MUTCD signs.
7. Lock/unlock Roadways, Signs and Devices.
8. Verify normal PDF/markup tools.
9. Verify Save and PDF dialogs open.

R8
10. Open Production.
11. Draw a manual stop bar.
12. Draw a crosswalk.
13. Draw a median.
14. Draw a 3-point curb return.
15. Add a manual road station label.
16. Lock Intersection Details and verify its objects cannot be moved/edited normally.
17. Save a manual template from ordinary eligible objects.
18. Place the template at a clicked position.
19. Insert a manual schedule.
20. Draw and select a Print Region, then Fit Selected Region.
21. Hide Print Regions and verify guide disappears.
22. Rename/re-number a sheet.
23. Duplicate a sheet and move it up/down.
24. Save NXP, reopen, and verify R8 objects/sheet metadata.
25. Export a flattened PDF and verify visible R8 graphics render.

ROLLBACK
Run:
  DISABLE_R8.bat

This restores index.R7.before_R8.html and leaves R7/R6.1/R6/R5/R4/R3 untouched.
