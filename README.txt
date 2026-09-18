NXT GEN PLANS — VERSION 0.1 R3 PORTABLE — REAL MUTCD SVG FIX
========================================

PURPOSE
-------
NXT Gen Plans is an offline, portable civil construction-plan review and markup application. R3 is the first build in this project in which an imported PDF is rendered inside the NXT plan workspace so NXT lines, clouds, hatches, text, stamps, traffic-control objects, and other markups can be placed directly over PDF plan pages.

STARTING THE PROGRAM
--------------------
1. Extract the ZIP to a writable folder such as Documents, Desktop, or a USB drive.
2. Double-click START_NXT_GEN_PLANS.bat.
3. The launcher prefers Microsoft Edge or Google Chrome in maximized app mode and enables local-file access needed by the bundled PDF engine.
4. No administrator rights or installer is required. On first launch, if the real MUTCD asset folder is not already available locally, the launcher downloads that asset folder from the project GitHub repository and verifies all 1,054 SVG files. After that, the traffic-sign library works offline.

If you are using the GitHub Desktop project folder, extract/copy the R3 files over the repository root. Windows folder merge will retain the existing assets/Signs SVGs/mutcd-svg-main folder. That activates the full 1,054-sign offline MUTCD SVG library already present in the repository.

R3 PDF WORKSPACE
----------------
Imported PDFs no longer open in a separate browser PDF iframe. R3 bundles PDF.js locally and renders each PDF page below the NXT SVG markup layer in the same page coordinate system.

On an imported PDF page you can now use:
- Hand / pan
- Marquee zoom
- Select/move/resize editable markups
- Line / arrow / callout
- Freehand pen
- Highlight
- Text Line / Text Box / Note Box
- Rectangle / square / ellipse / circle
- Regular and freeform cloud
- Regular and freeform hatch
- Polygon / polyline
- Built-in and custom stamps
- Traffic signs / temporary traffic-control objects
- Layers / markup list / properties
- Markup-log CSV export
- PDF text selection and conversion of selected PDF text into NXT highlight markups

NXT marks remain editable in the .NXP project. R3 PDF export is intentionally flattened for dependable viewing/printing in Adobe Acrobat/Reader and Bluebeam.

CANVAS-FIRST STARTUP
--------------------
R3 preserves the compact R2 layout requested for maximum planset real estate:
- Tools: CLOSED
- Pages: CLOSED
- Layers: CLOSED
- Properties: CLOSED
- Stamps: CLOSED
- Traffic: CLOSED
- Markups & Notes: CLOSED

Only the compact title/file strip, File/Edit/View/Document/Tools/Window/Help menu strip, compact tool strip, plan canvas, and small status strip are shown at startup.

FUNCTIONAL TOP MENUS
--------------------
The upper menus are now wired to working commands.

File:
- Open
- Save NXT Project
- Export / Print PDF
- New Blank Sheet
- Import Image

Edit:
- Undo / Redo
- Copy / Paste markup
- Duplicate markup
- Delete markup

View:
- Fit Page / Actual Size / Fit Width
- Zoom In / Out
- Pages
- Markups & Notes
- Full Screen

Document:
- Insert Blank Sheet
- Duplicate / Delete page
- Rotate page clockwise / counterclockwise
- Previous / Next page

Tools / Window provide the drawing, PDF-text, Stamps, Traffic, Properties, Layers, Pages, and Notes controls.

NAVIGATION / ACROBAT-STYLE KEYS
--------------------------------
H             Hand / Pan (default)
V             Select
Z             Marquee / area zoom
Space         Temporary Hand while held
Ctrl + =      Zoom in
Ctrl + -      Zoom out
Ctrl + 0      Fit page
Ctrl + 1      Actual size / 100%
Ctrl + 2      Fit width
Ctrl + O      Open
Ctrl + S      Save NXT Project
Ctrl + P      Export / Print PDF
Ctrl + Z/Y    Undo / Redo
Ctrl + C/V    Copy / Paste markup
Ctrl + D      Duplicate markup
Page Up/Down  Previous / Next page
Escape        Close floating UI / return to Hand
Delete        Delete selected editable markup
Ctrl + wheel  Zoom

TEXT
----
Text is edited directly on the sheet, not in a separate text-entry window.
- Draw Text Line, Text Box, or Note Box and type in place.
- Double-click existing text to edit in place.
- Boxes resize horizontally, vertically, or both.
- Font, size, color, alignment, bold/italic, outline, fill, opacity, rotation, and layer are editable.
- R3 now checkpoints text edits for Undo.

RIGHT-CLICK / PROPERTIES
------------------------
Right-click a placed markup for a compact context menu:
- Properties
- Edit Text where applicable
- Duplicate
- Bring to Front / Send to Back
- Lock / Unlock
- Use Appearance as Default
- Delete

Right-click a drawing tool to edit that tool's defaults. The small Props button opens the selected object's or current tool's properties without permanently occupying the right side of the screen.

REGULAR + FREEFORM GEOMETRY
---------------------------
Regular / constrained:
- Rectangle / Square
- Ellipse / Circle
- Cloud Box
- Hatch Box

Non-symmetrical / freeform:
- Polygon
- Polyline
- Freeform Cloud
- Freeform Hatch

Freeform tools are placed by clicking vertices and double-clicking to finish.

HATCH LIBRARY
-------------
R3 renders the full hatch choices shown in Properties, including ANSI31 through ANSI38-style drafting patterns plus:
- 45 / 135 degree diagonal
- Crosshatch
- Horizontal / vertical / grid
- Dots
- Earth / soil
- Sand
- Gravel
- Concrete
- Riprap / rock
- Asphalt / stipple
- Demolition / removal
- Proposed
- Existing

Hatch color and spacing are independent from outline color/width/style and background fill/opacity.

STAMPS
------
Built-in inspection groups include Field / Inspection, Traffic Signals, Traffic Signs, and Temporary Traffic Control, including:
- FIELD VISIT PENDING
- FIELD VISIT REQUIRED
- FIELD INSPECTION REQUIRED
- PASSED INSPECTION
- PASSED PRE-POUR INSPECTION
- PASSED PRE-PAVE INSPECTION
- SIGNAL INSPECTION PASSED
- SIGN INSTALLATION VERIFIED
- TTC APPROVED
- TRAFFIC CONTROL NOT PER PLAN

Custom PNG/JPG/SVG stamps can be imported into the local Custom Stamps library. R3 fixes the previous behavior: the actual imported artwork is now placed on the drawing, remains resizable, and is embedded in the NXT project/flattened export.

MUTCD / TEXAS TRAFFIC LIBRARY
-----------------------------
The compact Traffic button opens a searchable floating library. R3 normalizes common code searches, so a search such as W20-1 can locate the zero-padded W20-01 asset code used by the SVG package.

When assets/Signs SVGs/mutcd-svg-main is present, R3 loads its index.json and exposes the complete 1,054-sign vector catalog. The library metadata includes sign code, name, category, shape/background information, and the SVG asset path. Placing a sign embeds its SVG data in the markup so the placed sign survives project save/reopen and PDF export.

The supplied repository library contains:
- 1,054 total SVG sign faces
- 428 regulatory
- 271 warning
- 253 guide
- 14 school
- 88 other

W20-W26 work-zone signs include Road Work, Detour, Road Closed, One Lane Road, Lane Closed, Flagger, Workers, Shoulder Work/Closed, Survey Crew, Utility Work, Mowing, Blasting Zone, Slow Traffic, New Traffic Pattern, and related signs.

Generated federal fallback signs are DISABLED in this corrected build. If the full SVG folder is absent or incomplete, the Traffic library reports the missing real assets instead of displaying generated substitute signs. The launcher attempts to copy the complete library from a local GitHub Desktop clone first, then downloads it from the project GitHub repository when needed.

Texas-specific references remain separately identified from federal MUTCD artwork. Final sign application/fabrication must be verified against the current TMUTCD, TxDOT SHSD, project documents, and applicable TxDOT standards.

PAGES / STANDARD SHEETS
-----------------------
Blank sheet creation includes:
- Letter / Legal
- Tabloid / ANSI B
- ANSI A, B, C, D, E
- ARCH A, B, C, D, E
- ARCH E1 (30 x 42)

R3 corrected Legal to the true 8.5 x 14-inch PDF page dimension.

PDF EXPORT
----------
Export / Print PDF includes:
- All Pages or Current Page
- Keep each source page size
- Letter / Legal
- ANSI B / C / D / E
- ARCH C / D / E / E1
- 110 / 150 / 200 / 300 DPI
- Fit to output sheet
- Shrink oversized pages only
- Actual size, centered

PDF page boxes are written in true PDF points. R3's PDF writer produces PDF 1.7 files with the requested MediaBox dimensions. Export is flattened by design in R3 so appearance is reliable in Adobe/Bluebeam and normal printing workflows.

IMPORTANT R3 EXPORT NOTE
------------------------
R3 does not yet preserve the original imported PDF's vector/text objects in the exported file. The source PDF page is rendered and combined with the NXT markup layer to create the flattened review PDF. The editable .NXP file is the working/master review file.

A later release can add a native PDF annotation/vector-preserving export path after the R3 PDF workspace is accepted.

PROJECT SAVE / REOPEN
---------------------
.NXP files save:
- page order
- source PDF bytes when present
- blank/image pages
- deleted/duplicated/rotated PDF-page state
- markups
- layers
- style defaults
- embedded MUTCD sign artwork already placed on sheets

R3 fixes project restoration so the saved NXT page list is authoritative; reopening no longer silently recreates deleted PDF pages or loses duplicated/mixed pages.

PORTABILITY
-----------
The bundled PDF.js engine, worker, CMaps, standard fonts, ICC resources, and WASM helpers live under vendor/pdfjs. The launcher uses only local files. Custom stamps use the browser profile's local storage and are also embedded into placed stamp markups.

VERSION
-------
NXT Gen Plans 0.1 R3 — Real MUTCD SVG Fix
PDF markup-engine foundation / Texas civil plan-review build.

R3 LOCAL MUTCD CORRECTION
-------------------------
START_NXT_GEN_PLANS.bat no longer runs PowerShell and never downloads anything.
It opens the app normally and performs only a silent, best-effort copy of the real
MUTCD assets if a local NEXT-Gen-Plans GitHub clone is found in a common location.

VERIFY_MUTCD_ASSETS.bat is optional and reports whether index.json and exactly
1,054 real SVG files are present under:
  assets\Signs SVGs\mutcd-svg-main\svg

The old generated federal sign catalog is not used as the federal MUTCD source.
