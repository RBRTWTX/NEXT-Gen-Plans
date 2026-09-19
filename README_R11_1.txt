NXT GEN PLANS 0.1 R11.1
RESPONSIVE TEXT / LAYOUT COMPATIBILITY

BUILT AGAINST CURRENT PUSHED GIT
  cb849895 — r11

ISSUE FIXED
Resizable text-bearing objects could change their outer box dimensions without
their inner text/table layout fully adapting to the new width and height.

The R11 title-block example made this especially visible:
the border widened, but labels/value positions and fixed font sizes remained
based on the original geometry.

R11.1 fixes this as a compatibility layer after R11.

AFFECTED OBJECTS

R3
- Text Line
- Text Box
- Note Box

Behavior:
- text is wrapped from current live width
- font shrinks only when necessary to fit current live height/width
- user font size remains the maximum size
- widening the box gives the text more usable line width
- narrowing/shortening the box reduces font size only as needed
- inline text editor uses the same fitted font size

R4
- R4 title-block text fields are R3 text objects
- therefore they automatically receive the same R11.1 behavior

R5
- sign legend uses an R3 Note object
- therefore it receives responsive wrapping/fitting

R8
- manual schedule / legend note uses an R3 Note object
- therefore it receives responsive wrapping/fitting

R10
- placed Scratchpad copies retain their actual markup types
- placed text/note/title objects therefore use the responsive renderer

R11
Responsive live layout now applies to:
- Title Block
- Revision Table
- Manual Table
- Legend Snapshot
- Manifest Snapshot
- Plan Note
- Continuation reference
- Detail reference
- Match-line reference
- Sequential number stamp/reference objects

R11 TITLE BLOCK
When resized:
- header spans the live width
- drawing number stays aligned to live right edge
- project/location region uses live width
- label/value divider is proportional to live width
- row heights use live height
- label/value font sizes fit the available cells

R11 TABLES
When resized:
- columns consume full current width
- header text fits each current column
- body rows consume current available height
- cell text wraps inside the current cell
- font shrinks only when required to prevent overflow

R11 NOTES
- text rewraps at current width
- text shrinks only when required by current height

R11 REFERENCES / NUMBER STAMPS
- text fits current object dimensions
- sequential stamp circle/plain/square selection is respected by the
  responsive renderer

NO AUTOMATION CHANGE
This patch does not:
- create traffic-control objects
- alter layouts automatically
- change sign/device placement
- use maps/cloud services
- change legend/manifest snapshot behavior

INSTALL
Copy files to project root and run:
  INSTALL_R11_1.bat

Installer creates:
  index.R11.before_R11_1.html

ROLLBACK
Run:
  DISABLE_R11_1.bat

ACCEPTANCE TEST

1. Launch.
2. Create R3 Text Box with a paragraph.
3. Drag box wider.
   PASS: fewer lines / wider text layout.
4. Drag box narrower.
   PASS: text wraps and shrinks only if required.
5. Drag height smaller.
   PASS: font shrinks rather than clipping immediately.
6. Create R3 Note and repeat.

7. Open R11 Docs.
8. Insert Title Block with all fields populated.
9. Drag title block wider.
   PASS: internal divider/fields use the new width.
10. Drag title block narrower.
    PASS: field text fits/shrinks within cells.
11. Drag title block taller.
    PASS: row heights expand.
12. Drag title block shorter.
    PASS: rows/fonts contract rather than falling outside frame.

13. Insert Revision Table with long descriptions.
14. Make table wider.
    PASS: columns and text use wider cells.
15. Make table narrower.
    PASS: cells wrap/shrink rather than overflow.

16. Insert Manual Table.
17. Repeat horizontal and vertical resize tests.

18. Insert Legend Snapshot and Manifest Snapshot.
19. Resize each both directions.
    PASS: content remains inside each table.

20. Insert R11 Plan Note with long text.
21. Resize width and height.
    PASS: text reflows live.

22. Insert continuation/detail reference.
23. Resize.
    PASS: text remains centered/fitted.

24. Start number stamper with Circle.
25. Place number.
26. Resize number object.
    PASS: border/text follow live dimensions.

27. Save one title block to R10 Scratchpad.
28. Place it elsewhere.
29. Resize placed copy.
    PASS: responsive behavior remains.

30. Save NXP.
31. Reopen.
32. Resize a responsive object.
    PASS: behavior remains.

33. Export PDF.
34. Confirm rendered text matches workspace layout.

STATIC VALIDATION
- r11-1-responsive-text.js syntax checked
- INSTALL_R11_1.js syntax checked
- no MutationObserver introduced
- no R3-R11 runtime file packaged for replacement
- ZIP integrity checked
