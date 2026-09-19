NXT GEN PLANS 0.1 R11.3 — BASE PLAN DRAWING STACK

BUILT AGAINST
  a7328f2e — cleanup

PURPOSE
Anything serving as the plan/base stays underneath objects drawn over it.

STACK
  PDF / PNG background
  Drawn roadway / intersections / permanent pavement / road masks
  Normal markups, TCP, devices, signs, notes and documentation
  Selection/edit handles

WHAT CHANGED
- Adds basePlanLayer between backgroundLayer and markupLayer.
- R4/R5/R6 roadway geometry renders underneath ordinary markups.
- R6 intersections render underneath ordinary markups.
- Permanent pavement and R5 road/lane masks are base-plan infrastructure.
- TCP+, Manual TCP, signs, devices, work areas, notes and docs stay above.
- Road-Attached Manual TCP still reads road geometry.
- Road editing remains available. Roads are NOT automatically locked.
- Existing object/layer lock controls still work.
- Bring Front / Send Back still works for normal overlay objects.
- Base-plan objects cannot be promoted above TCP overlays.
- PDF/PNG behavior is unchanged.
- Export automatically includes basePlanLayer because the existing exporter clones pageSvg.

NO CLOUD / MAP / AUTOMATION CHANGES
No cloud, live map or automatic TCP generation is added.

INSTALL
  INSTALL_R11_3.bat

VERIFY
  VERIFY_R11_3_INSTALL.bat

ROLLBACK
  DISABLE_R11_3.bat

ACCEPTANCE
1. Open PNG or PDF and place signs/devices/text over it.
2. Draw roadway.
3. Place cone directly on road — cone must display/select above road.
4. Place MUTCD sign partly over road — sign must stay above road.
5. Draw TCP+ work area over road.
6. Draw Manual TCP Free Canvas device run over road.
7. Move/select those objects without the road taking precedence.
8. Edit road with Road+; after edit it must remain below overlays.
9. Lock Roadways layer and continue placing TCP over it.
10. Unlock Roadways and edit again.
11. Use Manual TCP Road-Attached mode and verify it still follows the road.
12. Save/reopen NXP and export PDF.
13. Confirm workspace/export stack matches.
