NXT GEN PLANS — VERSION 0.1 R2 PORTABLE
========================================

PURPOSE
-------
NXT Gen Plans is an early offline, portable civil construction plan review and markup application with a Texas-oriented traffic-control reference library.

STARTING THE PROGRAM
--------------------
1. Extract the entire ZIP to a writable folder (Desktop, Documents, USB drive, etc.).
2. Double-click START_NXT_GEN_PLANS.bat.
3. The launcher first tries Microsoft Edge or Google Chrome in maximized app mode (no normal browser tabs/address bar). If neither is found at a standard location, it falls back to the Windows default browser. No administrator rights, installer, service, web server, login, or internet connection is required for the program itself.

CANVAS-FIRST STARTUP
--------------------
Version 0.1 R2 deliberately starts with the maximum practical plan-sheet area:
- Tools palette: CLOSED
- Pages palette: CLOSED
- Layers palette: CLOSED
- Properties palette: CLOSED
- Stamps palette: CLOSED
- Traffic library: CLOSED
- Markups & Notes: CLOSED

Only the compact title/file strip, menu strip, tool strip, plan canvas, and small status strip remain visible.
Click outside a floating palette or press Escape to dismiss it.

NAVIGATION / ADOBE-STYLE KEYS
------------------------------
H             Hand / Pan (default)
V             Select
Z             Marquee / area zoom
Space         Temporary Hand while held
Ctrl + =      Zoom in
Ctrl + -      Zoom out
Ctrl + 0      Fit page
Ctrl + 1      Actual size / 100%
Ctrl + 2      Fit width
Escape        Close floating UI / return to Hand
Delete        Delete selected editable markup
Ctrl + wheel  Zoom

TOOLS
-----
Review:
- Highlight
- Freehand Pen
- Line
- Arrow
- Callout
- Measure

Text:
- Text Line
- Text Box
- Note Box

Regular / constrained geometry:
- Rectangle
- Square
- Ellipse
- Circle
- Cloud Box
- Hatch Box

Freeform / non-symmetrical geometry:
- Polygon
- Polyline
- Freeform Cloud
- Freeform Hatch

Freeform geometry is placed by clicking points and double-clicking to finish.

INLINE TEXT EDITING
-------------------
Text entry happens directly on the plan sheet.
- Draw a Text Line, Text Box, or Note Box and type in place.
- Double-click existing text to edit it in place.
- Text boxes have resize handles and may be made wide, tall, square, or narrow.
- Font family, size, color, alignment, bold, italic, box outline, line style, fill, fill opacity, rotation, and overall opacity are editable.

RIGHT-CLICK / PROPERTIES
------------------------
Right-click an object for its compact context menu:
- Properties
- Edit Text (text objects)
- Duplicate
- Bring to Front / Send to Back
- Lock / Unlock
- Use Appearance as Default
- Delete

Right-click a drawing tool to open that tool's default appearance properties.
The single Props button in the top strip opens Properties for the selected object or current tool.

HATCH LIBRARY
-------------
The hatch system supports independently editable hatch color, background fill, opacity, spacing, outline color, outline width, and outline style.
Included families currently include:
- ANSI31 through ANSI38 drafting-style patterns
- 45 / 135 degree diagonal
- crosshatch
- horizontal / vertical / grid
- dot field
- EARTH / soil
- AR-SAND style
- GRAVEL style
- AR-CONC / concrete style
- riprap / rock
- asphalt / stipple
- demolition / removal
- proposed work
- existing feature

These are plan-review/drafting patterns, not a claim of certified CAD material definitions.

LAYERS
------
Layers are available from the small Layers button and remain closed at startup.
Initial layers:
- Default
- Review / Comments
- Traffic Control
- Measurements

Each layer can be:
- made active for new markups
- shown / hidden
- locked / unlocked

The selected object's layer can also be changed in Properties. Traffic-library objects default to Traffic Control.

TEXAS TRAFFIC CONTROL BUTTON
----------------------------
One compact Traffic button opens a floating, searchable library without permanently consuming plan real estate.
The R2 reference catalog includes:
- 179 common MUTCD sign/code entries, including a substantial Part 6 temporary-traffic-control group
- 23 Texas / TxDOT sign-code references
- 13 temporary traffic-control devices / plan objects
- 19 TxDOT BC / TCP / WZ standard-sheet references

Search by sign code or words such as:
  W20-1
  lane closed
  flagger
  CW20
  TCP 2-4

The current visual sign faces are plan-reference renderings. They are NOT certified sign-fabrication drawings. Final sign design, size, application, and fabrication must be checked against the current Texas MUTCD, TxDOT Standard Highway Sign Designs for Texas, and applicable TxDOT BC/TCP/WZ standards.

TRAFFIC DEVICES / PLAN OBJECTS
------------------------------
Current objects include:
- cone
- drum
- vertical panel
- Type III barricade
- portable concrete traffic barrier
- arrow board
- PCMS
- truck-mounted attenuator
- flagger
- work vehicle
- traffic-flow arrow
- work zone / work space
- buffer area

STAMPS
------
Built-in groups include Field / Inspection, Traffic Signals, Traffic Signs, and Temporary Traffic Control.
Examples:
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

Custom PNG/JPG/SVG stamps can be imported into the local custom-stamp library.

PAGES / FILES
-------------
- Blank Letter / Legal sheets
- ANSI A through E
- ARCH A through E
- Image-backed sheets
- Multiple NXT pages
- Save/reopen editable .NXP project files
- Flattened PDF 1.7 export from NXT plan-canvas pages

CURRENT PDF LIMITATION — IMPORTANT
----------------------------------
Existing imported PDF files currently open in the browser's native PDF viewer so normal viewing and PDF text selection work. Version 0.1 does NOT yet attach the NXT editable overlay engine directly to each imported PDF page.

Therefore:
- NXT blank/image-backed sheets: editable
- NXT markups: editable
- NXT .NXP projects: editable and reopenable
- Imported PDF: native view/text selection only at this checkpoint
- Flattened NXT canvas pages: exportable to PDF

A true imported-PDF page/render/annotation engine remains the next major foundation milestone. This limitation is intentionally stated rather than rasterizing imported engineering PDFs and pretending they remain native PDF content.

PORTABILITY / DATA
------------------
The program files are self-contained in this folder. The app itself makes no internet requests.
Browser security rules control where downloads are saved. Custom stamps use browser local storage on that Windows/browser profile.

VERSION
-------
NXT Gen Plans 0.1 R2
Canvas-first civil/Texas construction review foundation.
