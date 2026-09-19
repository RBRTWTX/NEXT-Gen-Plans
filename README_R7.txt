NXT GEN PLANS 0.1 R7 — MANUAL ROAD-ATTACHED TCP TOOLS

BASELINE VERIFIED BEFORE BUILD
Git head: e0b69c73 — Folder cleanup.
Active load order: app.js -> R4 -> R5 -> R6 -> R6.1 FIX2
MUTCD library: 1,054 SVG files.

R7 IS NOT AUTOMATED.
It does not generate lane closures, determine taper lengths, place signs, choose spacing, or build TCP layouts.

YOU manually choose:
- roadway
- tool
- exact start and end clicks
- lateral offsets
- device type
- spacing
- line style
- tab color
- work-area width

R7 adds:
1. Manual road-attached device runs: cone, drum, vertical panel, barricade, barrier.
2. Manual temporary line following a chosen road.
3. Manual temporary tabs following a chosen road.
4. Manual taper/shift line with separate start/end offsets.
5. Manual work area with separate left/right offsets.
6. Manual start/end station handles that drag along the road.
7. R7-specific Properties for road, stations, offsets, device/spacing/line settings.
8. Road-relative attachment so a manually placed item remains fitted to the road if the road is later curved or reshaped.

COMPATIBILITY DESIGN
- R7 loads after R6.1 FIX2.
- R7 does not replace app.js, R4, R5, R6, or R6.1.
- R5 TCP+ remains independent.
- R6 Road+ remains independent.
- R6.1 dedicated layer locks are respected.
- A locked Roadways layer can still be referenced by R7 without moving the road.
- Traffic Devices / Work Zones / Temporary layers block R7 editing when locked.
- R7 objects are stored in normal NXP project JSON.
- Existing flattened PDF export includes R7 SVG output.
- Page rotation leaves R7 metadata alone because its geometry derives from the referenced road.

INSTALL
Copy all package files into the project root and run:
  INSTALL_R7.bat

Then launch normally with:
  START_NXT_GEN_PLANS.bat

Installer backup:
  index.R6_1.before_R7.html

Rollback:
  DISABLE_R7.bat

ACCEPTANCE TEST — EXISTING FEATURES FIRST
1. Launch application.
2. Open TCP+ and confirm it does not freeze and health is green.
3. Draw an R5 multi-segment road.
4. Open Road+ and create/edit an R6 road.
5. Open Traffic and confirm MUTCD signs load.
6. Test Layers lock/unlock for Roadways and Traffic Signs.
7. Confirm Props and ordinary markups still work.
8. Confirm Save NXP and PDF export dialogs still work.

ACCEPTANCE TEST — R7
1. Open Manual TCP.
2. Choose an existing road.
3. Lock Roadways.
4. Create a manual cone run using two exact clicks.
5. Verify the locked road does not move.
6. Select the cone run and drag its two blue station handles.
7. Change device spacing and offset in Props.
8. Create temporary tabs.
9. Create a manual taper using start/end offsets you enter.
10. Create a manual work area using offsets you enter.
11. Unlock Roadways and curve the road in Road+.
12. Verify R7 items remain fitted to that road without any new items being generated.
13. Lock Traffic Devices and verify the device run cannot be edited.
14. Save NXP and reopen it.
15. Export PDF and verify the R7 graphics appear.
