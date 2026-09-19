NXT GEN PLANS 0.1 R6.1 — TCP+ / LAYER INTEGRATION

BUILT AGAINST CURRENT PUSHED GIT
Head checked before build:
  e9b7739d — r6

The package does NOT replace:
- app.js
- r4-addon.js
- r5-addon.js
- r6-addon.js
- standards.js
- START_NXT_GEN_PLANS.bat
- MUTCD assets

R6.1 ADDS

1. HARD LAYER LOCKING
A layer lock now protects the selected object from:
- move
- resize
- delete
- duplicate
- Bring to Front / Send to Back
- text/property mutation
- R6 roadway control-node editing
- R6 curve-handle editing

Locked objects remain visible and show a LOCKED LAYER selection outline.
Properties become read-only until the layer is unlocked.

2. DEDICATED TCP LAYERS
R6.1 creates:
- Roadways
- Permanent Pavement Markings
- Traffic Signs
- Traffic Devices
- Work Zones / Areas
- Temporary Striping / Tapers

Known R5/R6 objects are conservatively migrated only when they are still on
broad default/design/traffic layers.

The Layers palette gets quick controls:
- Lock Roads
- Lock Signs
- Lock Devices
- Lock Markings
- Lock Work Zones
- Lock Temporary
- Organize Existing TCP Objects
- Unlock TCP Layers

3. TCP+ RUNTIME GUARD
R6.1 reasserts the R5 multi-segment-road pointer isolation AFTER R6 loads.
It does not replace the R5 TCP+ road implementation.

When TCP+ opens, a runtime health badge verifies:
- multi-segment road
- six pavement marking controls
- five work-zone controls
- two mask controls
- stop bar
- flow arrow
- taper
- legend
- north arrow

If a control is missing, the badge turns red and names the problem.

4. SAFE INTERSECTION REFRESH
The R6 "Create / Refresh Intersections" button is intercepted by R6.1.
Intersection detection reads R4/R5/R6 road geometry WITHOUT promoting or
modifying the source road objects.

5. R6 / TCP+ MODE ISOLATION
Opening TCP+ while an R6 drawing mode is armed returns to Select before a TCP+
tool is chosen. R5 tools then set their own drawing mode normally.

INSTALL
Copy these files into the repo root:
- r6-1-integration.js
- r6-1-integration.css
- INSTALL_R6_1.js
- INSTALL_R6_1.bat
- VERIFY_R6_1.bat

Run:
  INSTALL_R6_1.bat

Then launch normally:
  START_NXT_GEN_PLANS.bat

The installer creates:
  index.R6.before_R6_1.html

ACCEPTANCE TEST
1. Open TCP+.
   Green badge should say TCP+ integration verified.
2. Draw a multi-segment road.
3. Open Road+ and create/edit an R6 road.
4. Open Layers.
5. Click Organize Existing TCP Objects.
6. Lock Roadways.
7. Road should not move, resize, delete, duplicate, curve or change Properties.
8. Add MUTCD signs.
9. Lock Traffic Signs.
10. Add devices/markups without disturbing roads/signs.
11. Unlock Roads and verify R6 nodes/curves work again.
12. Create/Refresh Intersections and confirm source roads are not automatically
    converted/promoted.
