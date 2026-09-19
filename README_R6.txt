NXT GEN PLANS 0.1 R6 — EDITABLE ROADWAYS / INTERSECTIONS / ROAD-AWARE STRIPING

BASELINE VERIFIED BEFORE BUILD
Git main head:
  76c7efe1 — "r5 fix"

R5 FIX1 is present in the pushed r5-addon.js.
The existing app.js, R4, R5, launcher and 1,054-file MUTCD library remain the baseline.

R6 IS STRICTLY ADDITIVE
The installer only adds:
  r6-addon.css
  r6-addon.js
to index.html AFTER R5.

It does NOT modify:
  app.js
  r4-addon.js
  r5-addon.js
  standards.js
  START_NXT_GEN_PLANS.bat
  MUTCD assets

R6 FEATURES

1. EDIT EXISTING R5 ROADS
Select an R5 road and choose Road+ -> Edit Selected R5/R6 Road, or select it and open Props.
Only that selected road is promoted to the R6 editable-road representation.
Other R5 objects continue using their existing R5 behavior.

2. STRAIGHT EDITABLE ROAD
Road+ -> Draw Straight Editable Road
Click-drag start to end.

3. ROAD CONTROL POINTS
When an R6 road is selected:
- blue circular nodes appear
- drag a node to reshape the road
- add a control point
- remove a control point
- straighten a selected curved segment
- straighten all road segments

4. ONE-CLICK / DRAG CURVE
Select an R6 road.
Click and drag directly on ANY road segment.
That segment converts to a quadratic curve and follows the drag.
Orange curve-control handle remains available while selected.
Use "Straighten Segment" to turn it back into a straight section.

5. ROAD-SPECIFIC PROPERTIES
Selecting a road and opening Props adds:
- lane count
- lane width
- left shoulder
- right shoulder
- center-divide location
- centerline style
- left/right edge lines
- a pavement-marking control for each lane boundary

Changing lane count automatically rebuilds the available lane-boundary controls.

6. PER-LANE PAVEMENT MARKINGS
Supported lane-boundary styles:
- None
- Dashed White
- Solid White
- Double White
- Dashed Yellow
- Solid Yellow
- Double Yellow

7. ROAD-AWARE TEMPORARY STRIPING / TABS
In road Properties:
- choose road boundary
- Temporary White Tabs
- Temporary Yellow Tabs
- Temporary Dashed White
- Temporary Solid White
- Temporary Solid Yellow
- Temporary Dashed Yellow
- set tab spacing in feet
- add/remove striping rules

Temporary striping and tabs follow the road geometry, including curved sections.

8. INTERSECTIONS V1
Road+ -> Create / Refresh Intersections
Detects:
- roadway crossings
- T intersections where a roadway endpoint terminates into another roadway
Creates editable intersection objects without modifying the source road geometry.

INSTALL
Copy these into the ROOT of the current working repository:
  r6-addon.js
  r6-addon.css
  INSTALL_R6.js
  INSTALL_R6.bat
  VERIFY_R6_INSTALL.bat

Run:
  INSTALL_R6.bat

Then continue launching with:
  START_NXT_GEN_PLANS.bat

ROLLBACK
The installer creates:
  index.R5.before_R6.html

Restoring that file over index.html disables R6 without altering any R3/R4/R5 source file.

ACCEPTANCE TEST ORDER
1. Confirm normal R5 TCP+ opens.
2. Confirm existing R5 multi-segment road still draws.
3. Open Road+.
4. Select an R5 road -> Edit Selected Road.
5. Drag blue road nodes.
6. Click-drag a road segment to curve it.
7. Straighten that segment.
8. Change lane count in Props and confirm boundary controls update.
9. Add Temporary White Tabs to an internal boundary.
10. Curve the road and verify tabs follow the curve.
11. Draw a second road crossing it.
12. Create / Refresh Intersections.
13. Confirm Traffic / MUTCD, Stamps, PDF tools and R5 TCP+ still open normally.
