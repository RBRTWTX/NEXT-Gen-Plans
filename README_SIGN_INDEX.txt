NXT GEN PLANS — SIGN INDEX BUILDER

WHY THIS IS NEEDED
The Traffic palette does not scan the SVG directory by itself.

It loads:
  assets\Signs SVGs\mutcd-svg-main\index.json

At the audited Git state:
  Git head: fdad5371 — added more svgs
  SVG files present: 2,229
  index.json entries: 1,054
  unindexed SVG files: 1,175

Therefore the 1,175 newly added SVG files exist in Git but will not appear in
the Traffic palette until index.json is updated.

FILES

UPDATE_SIGN_INDEX.ps1
- preserves every current index.json entry and its metadata
- scans the actual svg folder
- appends only missing SVG files
- creates a timestamped backup of index.json first
- infers a usable display code/category for supplemental files
- verifies all SVGs are indexed exactly once

RUN_UPDATE_SIGN_INDEX.bat
- convenience launcher for UPDATE_SIGN_INDEX.ps1

VERIFY_SIGN_LIBRARY.ps1
- read-only verification
- compares index.json to the actual SVG folder
- reports:
  * unindexed SVGs
  * missing SVG paths
  * duplicate indexed paths

USE

Copy these files to the repository root.

Run:
  RUN_UPDATE_SIGN_INDEX.bat

Or in PowerShell:
  powershell -ExecutionPolicy Bypass -File ".\UPDATE_SIGN_INDEX.ps1"

Then verify:
  powershell -ExecutionPolicy Bypass -File ".\VERIFY_SIGN_LIBRARY.ps1"

EXPECTED RESULT FOR THE CURRENT AUDITED TREE

  SVG files:       2229
  Index entries:   2229
  Unindexed:       0
  Missing SVG:     0
  Duplicates:      0

After that:
1. Launch NXT Gen Plans.
2. Open Traffic.
3. Search several newly added filenames/codes.
4. Click them and confirm the actual SVG artwork places on the sheet.
5. Commit the changed:
     assets/Signs SVGs/mutcd-svg-main/index.json
   to Git.

IMPORTANT
The original 1,054 index entries are not regenerated or replaced.
Their existing names/categories/metadata are preserved.

New supplemental files receive inferred metadata only for catalog/search
purposes. The actual sign appearance still comes from the real SVG file.

The NXT loader already supports filenames with spaces because it resolves the
indexed path through URL handling before loading the SVG.

NO APP CODE CHANGE IS REQUIRED
The current app already uses:
  MUTCD_ASSET_BASE='assets/Signs SVGs/mutcd-svg-main/'

and loads:
  index.json

then each entry's:
  svg

path.

Once index.json includes the new files, they can load through the existing
local-file launcher.
