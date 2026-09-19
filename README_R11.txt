NXT GEN PLANS 0.1 R11
MANUAL PLAN DOCUMENTATION

BUILT AGAINST CURRENT GIT
  d684ab29 — r10

R11 PURPOSE
R11 adds professional plan-document presentation while preserving NXT's
manual/offline workflow.

R11 DOES NOT:
- generate traffic-control layouts
- choose sign/device placement
- use cloud services
- use live maps
- continuously alter legends/manifests in the background

LEGEND / MANIFEST BEHAVIOR
Legend and manifest objects are SNAPSHOTS.

They update only when the user explicitly:
- inserts a new snapshot
or
- selects one and presses Refresh Snapshot

This is deliberate.

FEATURES

1. TITLE BLOCK
Manual fields:
- Company
- Drawing Number
- Project
- Location
- Client
- Road / Site
- Plan Number
- Sheet
- Date
- Scale
- Prepared By
- Checked By
- Approved By
- Permit

The inserted title block is a normal editable/resizable plan object on the
Sheet Production layer.

2. REVISION TABLE
Rows are typed manually as:
  REV | DATE | DESCRIPTION | BY

3. MANUAL TABLE
User supplies:
- title
- headers separated with |
- rows separated by lines

Useful for:
- sign schedules
- contact lists
- notes
- device lists
- curb data
- inspection information

4. LEGEND SNAPSHOT
User clicks Insert Legend Snapshot.

R11 scans currently visible, placed traffic-control objects and records unique
entries at that moment.

Eligible categories include:
- traffic signs
- individual traffic devices
- device runs
- work zones
- pavement/temporary markings
- crosswalks
- curb-return details

5. MANIFEST SNAPSHOT
Same concept but includes quantity of PLACED OBJECTS.

Important:
A device run counts as one Device Run.
R11 intentionally does NOT infer how many cones/drums are represented by the
run spacing. That avoids turning the documentation tool into a design/quantity
automation engine.

6. REFRESH SNAPSHOT
Select an R11 Legend or Manifest and click:
  Refresh Selected Snapshot

No automatic/background refresh occurs.

7. SEQUENTIAL NUMBER STAMPER
Manual click stamper:
- starting number
- increment
- prefix
- suffix
- circle / square / plain selector

Example:
  Prefix D-
  Start 1
  Increment 1

Clicks create:
  D-1
  D-2
  D-3

Every location is manually clicked.

8. CONTINUATION / DETAIL REFERENCES
Manual reference boxes:
- Continuation
- Detail
- Match Line

User controls primary and secondary text.

Examples:
  SEE SHEET 2
  FOR CONTINUATION

  DETAIL A
  SHEET 3

  MATCH LINE A-A

9. PLAN NOTES
Manual titled note boxes with wrapped text.

10. EDIT EXISTING R11 DOCUMENTS
Select an R11 object and:
  Load Selected
  Update Selected

Legend/manifest objects use Refresh Snapshot instead.

LAYER
All R11 documentation uses:
  Sheet Production

Existing R6.1/R8.1 layer-lock behavior remains in force.

R10 COMPATIBILITY
R11 documentation objects are ordinary free plan objects and can be saved into
the R10 Scratchpad for reuse.

This is especially useful for:
- title blocks
- company notes
- standard detail references
- revision-table formats

R9 COMPATIBILITY
The number stamper uses R9 snapping when snapping is enabled.

IMAGE / SATELLITE WORKFLOW
R11 works directly over:
- PNG
- JPG
- imported aerial/satellite screenshots
- PDFs
- blank sheets

No roadway is required.

SAVE
R11 objects are stored in page markup JSON and therefore save in NXP files.

EXPORT
R11 renders into the existing SVG markup layer and is included in flattened PDF
export when its layer is visible.

INSTALL
Copy package files to project root and run:
  INSTALL_R11.bat

Installer creates:
  index.R10.before_R11.html

ROLLBACK
Run:
  DISABLE_R11.bat

ACCEPTANCE TEST

BASELINE
1. Launch.
2. Open PNG satellite image.
3. Open TCP+.
4. Open Manual TCP.
5. Open Production.
6. Open Edit+.
7. Open Library.
8. Confirm previous tools work.

TITLE BLOCK
9. Open Docs.
10. Fill title block fields.
11. Insert.
12. Move/resize it.
13. Lock Sheet Production and verify it cannot be edited.
14. Unlock.

REVISION / TABLE
15. Insert revision table with 2+ rows.
16. Insert manual table.
17. Select table and Load Selected.
18. Edit text and Update Selected.

LEGEND / MANIFEST
19. Add MUTCD signs/devices to page.
20. Insert Legend Snapshot.
21. Insert Manifest Snapshot.
22. Add another device.
23. Verify old snapshots DO NOT change.
24. Select manifest and Refresh Selected Snapshot.
25. Confirm refresh now reflects the new placed object.

NUMBER STAMPER
26. Start with D-1 increment 1.
27. Click three locations.
28. Confirm D-1 / D-2 / D-3.
29. Press Esc.
30. Confirm normal select mode returns.

REFERENCES / NOTES
31. Insert Continuation reference.
32. Insert Detail reference.
33. Insert Match Line reference.
34. Insert plan note.
35. Save a title block or note to R10 Scratchpad.
36. Place reusable copy.

SAVE / EXPORT
37. Save NXP.
38. Reopen.
39. Verify R11 objects remain.
40. Export flattened PDF.
41. Verify documentation appears.

STATIC VALIDATION
- r11-addon.js syntax checked
- INSTALL_R11.js syntax checked
- no MutationObserver introduced
- no R3-R10 runtime file packaged for replacement
- ZIP integrity checked
