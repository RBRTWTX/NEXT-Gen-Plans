NXT Gen Plans R3 - Local SVG Loader Launcher Fix

Replace ONLY START_NXT_GEN_PLANS.bat in the root of your current updated NEXT-Gen-Plans repo.

Why:
The previous launcher could reuse an already-running Edge/Chrome process. In that case,
--allow-file-access-from-files was ignored, so app.js could not read:
  assets/Signs SVGs/mutcd-svg-main/index.json
or the local SVG files.

This launcher forces a dedicated browser profile/process so the flag is actually active.

No PowerShell.
No asset copying.
No GitHub download.
No changes to app.js or your 1,054 SVG files.
