NXT GEN PLANS 0.1 R10
LOCAL SCRATCHPAD / LIBRARIES

BUILT AGAINST CURRENT GIT
  2ecfbe2a — r9

PURPOSE
R10 adds the reusable local-library workflow found in mature manual plan
software, while keeping NXT completely offline and user-controlled.

NO CLOUD
No account, web service, live map, synchronization service or online library
is used.

Library data is kept in the dedicated NXT Edge profile's localStorage.
Use Export JSON for a portable backup or transfer to another NXT installation.

FEATURES

1. SCRATCHPAD FOLDERS
Built-in folders:
- General
- Traffic Control
- Details
- Title Blocks
- Notes
- Custom Symbols

Users can:
- create folder
- rename custom folder
- delete custom folder
- search current folder

Deleting a custom folder moves its items to General.

2. ADD SELECTION
The Local Library can save:
- a single selected object
- an R9 multi-selection
- grouped objects
- MUTCD signs
- traffic devices
- ordinary markups
- R9 editable paths
- R8 intersection/detail objects
- free-canvas station labels
- user-built title blocks
- notes / detail assemblies

R7 road-attached objects, R8 road-relative station labels and R6 intersection
relationship objects are intentionally rejected as free Scratchpad objects.
Their behavior depends on external road/object IDs.

3. REUSABLE ASSEMBLIES
A multi-selection is stored relative to its original center.
Click Place, then click an insertion point.

Placement options:
- Saved Layers
- Current Active Layer

Internal R9 group IDs are regenerated when an assembly is placed, preventing
separate placements from accidentally becoming one group.

4. CUSTOM SYMBOLS
Import locally:
- PNG
- JPG
- WEBP
- SVG

The symbol is stored as a reusable Scratchpad object and can be placed onto any
plan or imported aerial image.

5. SAVED STYLES
Save the selected object's appearance:
- line color
- line width
- fill
- fill opacity
- dash
- hatch
- hatch color
- hatch spacing
- opacity
- rotation
- font
- font size
- text color
- alignment
- bold / italic

A style can:
- Apply to selected object(s)
- become the Current Drawing Default
- be deleted

6. CONTEXT MENU
Selected objects have:
  Add to Scratchpad

7. R8 TEMPLATE COMPATIBILITY
R10 does NOT delete or replace the old R8 template system.

The Library palette provides:
  Import Existing R8 Templates

Imported templates are copied into:
  Legacy R8 Templates

The old R8 template data remains unchanged.

8. LIBRARY JSON
Export JSON:
- folders
- Scratchpad items
- symbols
- styles

Import JSON:
- Replace current library
or
- Merge into current library

This is the recommended offline backup/transfer mechanism.

9. MUTCD SIGNS
A saved MUTCD sign retains its embedded artwork.
If a stored sign has an asset path but no embedded artwork, R10 attempts to
rehydrate it from the local 1,054-file MUTCD asset library during placement.

COMPATIBILITY

R3:
- PDF/image/save/export unchanged

R5 / TCP+:
- unchanged

R6 / R6.1:
- roads and layer locks unchanged

R7:
- Free Canvas and Road-Attached modes unchanged

R8:
- Production tools and legacy templates unchanged

R8.1:
- universal image/satellite workflow unchanged

R9:
- Scratchpad reads the actual R9 multi-selection through window.NXT_R9
- R9 paths can be saved and reused
- R9 groups remain groups after placement with fresh group IDs
- R9 snapping is used for Scratchpad insertion points when enabled

SAVE / PROJECT FILES
Scratchpad libraries are intentionally global to the local NXT installation,
not embedded into each NXP project.

Placed Scratchpad objects become normal page markups and are then stored in the
NXP normally.

INSTALL
Copy package files into the project root and run:
  INSTALL_R10.bat

Installer creates:
  index.R9.before_R10.html

ROLLBACK
Run:
  DISABLE_R10.bat

Rollback removes R10 from the runtime by restoring the pre-R10 index.
It does not erase the local R10 library.

ACCEPTANCE TEST

EXISTING FEATURES
1. Launch.
2. Open PNG satellite image.
3. Open TCP+.
4. Open Road+.
5. Open Manual TCP.
6. Open Production.
7. Open Edit+.
8. Draw/edit an R9 path.
9. Confirm layers still lock correctly.

SCRATCHPAD
10. Open Library.
11. Select an ordinary markup.
12. Add Selection.
13. Place it somewhere else.
14. Shift-select several objects in Edit+.
15. Add multi-selection to Library.
16. Place the assembly.
17. Verify the assembly remains editable.
18. Create a new Scratchpad folder.
19. Save an item into it.
20. Search for the item.
21. Rename the folder.
22. Delete the custom folder and confirm item moves to General.

R9 GROUP COMPATIBILITY
23. Group several R9-selected objects.
24. Save the selection to Scratchpad.
25. Place it twice.
26. Confirm the two placements have independent group IDs.

SYMBOLS
27. Import a PNG/SVG symbol.
28. Place it.
29. Resize/move it normally.
30. Save NXP and reopen.

STYLES
31. Select styled markup.
32. Save Selected Appearance.
33. Select a second object.
34. Apply style.
35. Set saved style as current drawing default.
36. Draw a new compatible object and verify defaults.

R8 TEMPLATES
37. If old R8 templates exist, Import Existing R8 Templates.
38. Place an imported template.

TRANSFER
39. Export Library JSON.
40. Import it using Merge.
41. Confirm imported folders/items/styles appear.

SAVE / EXPORT
42. Save NXP.
43. Reopen.
44. Verify placed library objects remain.
45. Export PDF.
46. Verify visible placed objects are present.

STATIC VALIDATION
- R10 JS syntax checked
- installer JS syntax checked
- no MutationObserver introduced
- no R3-R9 runtime files packaged for replacement
- ZIP integrity checked
