NXT GEN PLANS 0.1 R11.2 — PRE-R12 STABILIZATION

AUDITED CURRENT GIT
  2445585f — fix r11.1

FULL STATIC AUDIT COVERAGE
- index.html script and stylesheet chain
- R3 app.js
- standards.js
- R4
- R5 + accepted pointer FIX1
- R6
- R6.1 + accepted FIX2 freeze correction
- R7
- R8
- R8.1 Universal Canvas
- R9
- R10
- R11
- R11.1 responsive text
- launcher
- layer IDs/contracts
- cross-module NXT_* exports
- page duplication relationships
- image/PDF save-load paths
- PDF flattened export path
- layer-lock wrappers
- reusable library integration
- MUTCD library count
- root installer/rollback clutter

CONFIRMED GOOD
- Runtime order is coherent through R11.1.
- No duplicate active script/CSS tags.
- R6.1 recursive body MutationObserver remains removed.
- R8.1 road-free PNG/satellite workflow remains additive.
- Page duplication remaps r7RoadId/r8RoadId/R6 roads[] relationships.
- R10 Scratchpad regenerates group IDs when an assembly is placed.
- R11 documentation is free-canvas and does not require a road.
- R11.1 responsive text renderer sits last in the accepted text/layout chain.
- NXP saves pages/markups/layers and therefore retains R7-R11.1 object metadata.
- Flattened PDF export clones the live SVG overlay after render.
- 1,054 MUTCD SVG files remain.

FUNCTIONAL DEFECTS FOUND

1. MISSING DESIGN LAYER IN OLD-PROJECT RECOVERY
R4 uses:
  layer = design

R8.1 restores newer layers after loadProject replaces state.layers, but its
REQUIRED_LAYERS list omitted:
  design / Plan Design

Fresh sessions usually have the layer because R4 creates it at startup.
Older NXP files can replace the layer list and leave R4 design/title objects
referencing a missing layer.

R11.2 guarantees Plan Design exists before every render.

2. R9 GROUP DUPLICATION SHARED GROUP ID
R9 Duplicate Selection deep-copies r9GroupId unchanged.

Result:
a duplicated group can still have the same group ID as the source group.

R10 Scratchpad placement already regenerates group IDs correctly.
R11.2 now also isolates:
- R9 Duplicate Selection
- normal single-object Duplicate when that object belongs to an R9 group

No R9 source file is replaced.

NON-BLOCKING CLEANUP FINDINGS
The repository root still contains installers, verifiers, READMEs and rollback
HTML files from R8.1/R9/R10/R11/R11.1.

After R11.2 is installed and accepted, run:
  CLEAN_NXT_GEN_PLANS_R11_2.ps1
first without -Execute, then with -Execute.

The cleanup keeps:
- active runtime R3 through R11.2
- assets / vendor
- RESEARCH_NOTES.txt
- latest pre-R11.2 rollback HTML
- DISABLE_R11_2.bat

It removes older installer/rollback clutter already preserved by Git history.

README.txt
The root README.txt is still the old R3 launcher-fix note.
It is stale documentation, but the cleanup deliberately leaves it untouched
rather than deleting information automatically. It can be replaced with a
current project README in a later documentation-only commit.

LAUNCHER
START_NXT_GEN_PLANS.bat still uses R3 names in its console title/profile path.
That is intentionally NOT changed:
- the dedicated profile is known working
- changing profile paths would make R10 local libraries/custom browser storage
  appear missing because a new Edge/Chrome profile would be used

STATIC VS RUNTIME VERIFICATION
This audit verifies repository structure/contracts/source integration.
It cannot execute your Windows Edge instance from this environment.

Run VERIFY_NXT_R11_2.ps1 after installation, then perform the short runtime test:

1. Launch.
2. Open PNG.
3. Open PDF.
4. Open Traffic and place a MUTCD sign.
5. Open TCP+.
6. Open Road+.
7. Open Manual TCP in Free Canvas mode.
8. Open Production.
9. Open Edit+.
10. Create a 2+ object R9 group.
11. Duplicate the group.
12. Select one duplicated member -> Select Group.
    PASS: only duplicated members select, not originals.
13. Open Library and place a saved assembly.
14. Open Docs and resize a title block/note/table.
15. Save NXP and reopen.
16. Confirm Plan Design exists in Layers.
17. Duplicate a page containing a road + road-attached object.
18. Confirm attachment follows duplicated road.
19. Export PDF.
20. Confirm visible markups/documentation render.

INSTALL
Copy package contents to repo root.
Run:
  INSTALL_R11_2.bat

VERIFY
Run:
  powershell -ExecutionPolicy Bypass -File ".\VERIFY_NXT_R11_2.ps1"

CLEANUP PREVIEW
Run:
  powershell -ExecutionPolicy Bypass -File ".\CLEAN_NXT_GEN_PLANS_R11_2.ps1"

CLEANUP EXECUTE
Run:
  powershell -ExecutionPolicy Bypass -File ".\CLEAN_NXT_GEN_PLANS_R11_2.ps1" -Execute
