NXT GEN PLANS 0.1 R4 — PLAN CREATION FOUNDATION

PURPOSE
Adds plan-creation and temporary-traffic-control design capability to the verified R3 application.
This is additive: it does not replace app.js, standards.js, the real 1,054-file MUTCD library,
or your working dedicated-profile START_NXT_GEN_PLANS.bat.

INSTALL
1. Extract this ZIP.
2. Copy these files into the ROOT of your existing NEXT-Gen-Plans repo:
      r4-addon.js
      r4-addon.css
      INSTALL_R4.js
      INSTALL_R4.bat
      REMOVE_R4.js
3. Run INSTALL_R4.bat.
4. Continue launching the program with the WORKING START_NXT_GEN_PLANS.bat.

R4 FEATURES IN THIS BUILD
- Dedicated Rotate Sheet Left / Right toolbar buttons using R3's existing real rotation engine.
- New Plan wizard:
    * Blank Civil Plan
    * Blank Traffic Control Plan
    * Engineering sheet-size presets
    * Editable title-block/project metadata
    * Scale entry
- Sheet / Plan Setup editor.
- Two-point scale calibration.
- Measurement labels use calibrated feet when a page scale exists.
- Plan / TCP Design floating palette.
- Roadway V1:
    * lane count
    * lane width
    * shoulder width
    * centerline style
    * edge lines
    * roadway width honors page scale
- Channelizing Device Run:
    * cones
    * drums
    * vertical panels
    * Type III barricades
    * real-world spacing when page scale exists
- Automatic current-sheet Device / Sign Manifest.
- Preserves R3 PDF review, layers, markups, stamps, export, NXP projects and real MUTCD SVG library.

INTENTIONAL PHASING
Automatic intersections, turn lanes, road masks, lane masks, print regions and advanced TCP templates
belong in the next design phase after this foundation is acceptance-tested.

ROLLBACK
Run:
  cscript //nologo //E:JScript REMOVE_R4.js
This restores the backed-up R3 index.html. app.js was never changed.
