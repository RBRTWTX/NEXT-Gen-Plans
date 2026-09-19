NXT GEN PLANS 0.1 R9
UNIVERSAL MANUAL GEOMETRY & EDITING

BASELINE AUDITED
Git head at build:
  f652a20c — cleanup

Expected active runtime before install:
  standards.js
  app.js
  r4-addon.js
  r5-addon.js
  r6-addon.js
  r6-1-integration.js
  r7-addon.js
  r8-addon.js
  r8-1-compat.js

R9 loads AFTER R8.1 and does not replace any previous source file.

MANUAL-ONLY RULE
R9 does not:
- generate a traffic control plan
- choose sign/device locations
- calculate standards-driven layouts
- use live maps
- use a cloud service
- require a road

R9 FEATURES

1. MULTI-SELECT
- Shift-click toggles objects
- CAD-style Window Select:
  left-to-right = fully contained objects
  right-to-left = crossing selection
- selection count
- clear selection
- move selected objects
- move selected objects to another layer
- duplicate selected objects
- delete selected objects
- honors locked layers

2. GROUPING
- Group selected objects
- Ungroup
- Select all members of a group

Groups are ordinary local NXP metadata and save with the project.

3. EDITABLE FREE PATHS
Create manual node-based:
- generic paths
- device runs
- temporary lines
- temporary tabs
- taper / shift paths

No roadway is required.

4. CONTROL POINTS
For an R9 editable path:
- circle handles = nodes
- drag node
- square handles = segment selector
- double-click square = insert node
- Remove Node
- Curve Segment
- Straighten Segment
- purple control handle = reshape curved segment

5. SNAPPING
R9 path/node tools can snap manually to:
- endpoints
- segment midpoints
- anywhere along a segment
- optional grid

Master snap can be disabled.

This does not move or create objects automatically; it only changes the point
the user is actively placing/dragging.

6. MANUAL OFFSET GEOMETRY
For open line/path geometry:
- enter distance
- choose left/right
- choose Copy or Move
- apply

Supported:
- lines
- arrows
- device runs
- polylines
- R9 editable paths

Offset remains a user-entered manual operation.

7. APPEARANCE
- Copy Appearance
- Paste Appearance
Works across selected compatible objects for:
  stroke
  width
  fill
  opacity
  dash
  hatch
  text appearance
  rotation

8. CONVERSION
Existing line/polyline/device-run geometry can be explicitly converted into an
R9 editable path for node editing.

Roadways, R7 road-attached objects, R8 road-relative stations and R6
intersections are intentionally NOT converted because they have relational
behavior of their own.

COMPATIBILITY NOTES

R3
- PDF/image/open/save/export untouched
- ordinary markups untouched

R4
- plan creation/calibration untouched

R5 / TCP+
- no R5 handlers replaced

R6 / Road+
- road editing remains independent

R6.1
- hard layer locking remains in effect

R7
- Free Canvas and Road-Attached modes remain
- R9 can coexist with either

R8
- production/intersection/sheet tools remain

R8.1
- PNG/satellite workflow remains
- required layers remain
- page relationship duplication repair remains

SAVE
R9 editable paths, groups and geometry are ordinary markup metadata and are
serialized by the existing NXP save process.

EXPORT
Visible R9 paths are rendered into the existing SVG markup layer and are
included by the existing flattened PDF exporter.

INSTALL
Copy package files to project root and run:
  INSTALL_R9.bat

The installer creates:
  index.R8_1.before_R9.html

ROLLBACK
Run:
  DISABLE_R9.bat

ACCEPTANCE TEST

EXISTING FEATURES FIRST
1. Launch.
2. Open a PNG satellite image.
3. Add MUTCD sign.
4. Add a traffic device.
5. Open TCP+ and confirm no freeze.
6. Draw a TCP+ marking and work zone.
7. Open Road+ and confirm it still opens.
8. Open Manual TCP and draw a Free Canvas device run.
9. Open Production and draw a crosswalk.
10. Lock/unlock traffic layers.

R9
11. Open Edit+.
12. Draw Generic Editable Path with 3+ nodes.
13. Drag a node.
14. Select segment using square handle.
15. Curve Segment.
16. Drag purple curve handle.
17. Straighten Segment.
18. Double-click square segment handle to insert node.
19. Remove selected node.
20. Draw Editable Device Run.
21. Change device and spacing in Props.
22. Draw Editable Temporary Tabs.
23. Turn snapping on.
24. Snap a new node to an existing endpoint.
25. Snap to segment midpoint.
26. Snap to an arbitrary segment point.
27. Window-select several objects.
28. Group them.
29. Nudge group selection.
30. Move selection to another unlocked layer.
31. Duplicate selection.
32. Copy appearance from one object.
33. Paste appearance to another.
34. Select an open path and create a manual offset copy.
35. Lock its layer and verify R9 edits are blocked.

SAVE / EXPORT
36. Save NXP.
37. Reopen it.
38. Confirm R9 paths, groups and curves remain.
39. Export PDF.
40. Verify visible R9 geometry is present.

STATIC BUILD VALIDATION
- JavaScript syntax checked with Node
- installer syntax checked with Node
- no MutationObserver introduced
- no prior source module packaged for replacement
- ZIP integrity checked
