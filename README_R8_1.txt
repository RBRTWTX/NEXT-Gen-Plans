NXT GEN PLANS 0.1 R8.1 — UNIVERSAL CANVAS COMPATIBILITY

AUDITED AGAINST CURRENT GIT
  f01c0b3c — r8 r9

CURRENT STRUCTURE
  standards.js
  app.js
  r4-addon.js
  r5-addon.js
  r6-addon.js
  r6-1-integration.js
  r7-addon.js
  r8-addon.js
  r8-1-compat.js

NOTE ABOUT "R9"
There is no separate r9-addon.js in the current repository.
The former R9 sheet/production scope was combined into r8-addon.js.

WHY R8.1 EXISTS

The audit found four concrete integration gaps:

1. R7 ROAD DEPENDENCY
All current R7 Manual TCP tools require a roadway before they can be used.

R8.1 adds an explicit mode:
  Free Canvas / Satellite Image
  Road-Attached

Free Canvas is the default.

Free mode supports:
- device runs
- temporary lines
- temporary tabs
- taper / shift lines
- work-area polygons

No road is required.

Road-Attached mode preserves the existing R7 behavior exactly.

2. R8 STATION ROAD DEPENDENCY
Current R8 Manual Station Label requires a road.

R8.1 adds:
  Free Canvas / Satellite Image
  Road-Relative

Free mode places an ordinary editable station textbox on the image.
Road-Relative mode preserves existing R8 road-following station behavior.

3. PAGE DUPLICATION REFERENCE BREAKAGE
The base duplicatePage() gives every duplicated markup a new ID but does not
update relational references.

That breaks:
- R7 r7RoadId
- R8 r8RoadId
- R6 intersection roads[] references

R8.1 remaps these references immediately after the base duplicate completes.

4. OLD NXP LAYER LOSS
loadProject() replaces state.layers with the saved layer list.
An older NXP can therefore remove newer R6.1/R8 layers.

R8.1 verifies/recreates required layers before every render.

5. IMAGE OPEN RELIABILITY
The main Open handler clears its file input before handing an image to the image
import input. That can make PNG/JPG opening through Open unreliable.

R8.1 opens images directly as plan backgrounds.
It also lets the same image be imported twice in a row with Import Image.

SATELLITE IMAGE WORKFLOW AFTER R8.1

1. Open or Import a PNG/JPG satellite image.
2. Do NOT create a road unless you want one.
3. Traffic:
   - MUTCD signs work.
   - cones/drums/panels/barricades/barriers work.
4. TCP+:
   - pavement markings work.
   - work-zone polygons work.
   - masks work.
   - stop bars/arrows work.
   - manual taper works.
   - north arrow works.
   - sign legend works when signs are present.
5. Manual TCP:
   - choose Free Canvas (default).
   - draw device run directly on image.
   - draw temp lines/tabs/tapers directly on image.
   - draw work-area polygon directly on image.
6. Production:
   - crosswalks, stop bars, arrows, medians, curb returns work without roads.
   - station labels default to Free Canvas.
   - templates, schedules, print regions, sheet manager work without roads.

ROAD-AWARE FEATURES REMAIN AVAILABLE
A roadway is still required only when the user explicitly selects a road-aware mode:
- R6 Road+ editing
- R7 Road-Attached
- R8 Road-Relative Station

Nothing else is blocked by the absence of a roadway.

LAYERS VERIFIED / RESTORED
- Default
- Review / Comments
- Traffic Control
- Measurements
- Roadways
- Permanent Pavement Markings
- Traffic Signs
- Traffic Devices
- Work Zones / Areas
- Temporary Striping / Tapers
- Intersection Details
- Sheet Production
- Print Regions

ACCEPTANCE TEST — NO ROAD

A. IMAGE
1. Launch.
2. Open a PNG using Open.
3. Confirm image becomes plan background.
4. Import the same PNG again using Import Image.

B. BASE / TRAFFIC
5. Add ordinary markup.
6. Add stamp.
7. Add MUTCD sign.
8. Add cone/drum.
9. Use TCP+ pavement marking.
10. Draw TCP+ work area.
11. Draw TCP+ stop bar and arrow.

C. R7 WITHOUT ROAD
12. Open Manual TCP.
13. Leave mode at Free Canvas / Satellite Image.
14. Draw cone/device run.
15. Draw temporary line.
16. Draw temporary tabs.
17. Draw taper.
18. Draw work area.
19. Edit device spacing in Props.
20. Lock Traffic Devices and verify device run cannot be changed.

D. R8 WITHOUT ROAD
21. Open Production.
22. Draw stop bar.
23. Draw direction arrow.
24. Draw crosswalk.
25. Draw median/island.
26. Draw 3-point curb return.
27. Add Free Canvas station label.
28. Save/place template.
29. Insert schedule.
30. Draw print region.
31. Duplicate sheet.

E. ROAD-AWARE REGRESSION
32. Draw a road.
33. R7 switch to Road-Attached and create a road-following device run.
34. R8 switch station to Road-Relative and place station.
35. Duplicate the page.
36. Verify duplicated R7 attachment follows duplicated road, not original road.
37. Verify duplicated R8 station follows duplicated road.
38. Reshape duplicated road and verify both follow it.

F. SAVE / EXPORT
39. Save NXP.
40. Reopen NXP.
41. Verify layers and objects.
42. Export PDF with Print Regions hidden.
43. Verify all visible traffic-control graphics are present.

INSTALL
Copy all package files to project root.
Run:
  INSTALL_R8_1.bat

ROLLBACK
Run:
  DISABLE_R8_1.bat
