NXT GEN PLANS 0.1 R4 — FIXED INSTALLER

This replaces ONLY the broken R4 installer mechanism.

WHY THE FIRST INSTALLER FAILED
The original INSTALL_R4.js used:
    FileSystemObject.OpenTextFile(..., -1)
which interprets text as Unicode/UTF-16. The R3 index.html is UTF-8.
That caused the browser to display the corrupted characters seen during the failed R4 install.

CURRENT GIT STATUS VERIFIED BEFORE THIS FIX
- index.html is restored and valid.
- index.R3.before_R4.html matches the restored R3 index.
- working dedicated-profile START_NXT_GEN_PLANS.bat is present.
- r4-addon.js and r4-addon.css are present.
- the old INSTALL_R4.js in Git is still the unsafe version.

INSTALL
1. Copy these three files into the ROOT of the current NEXT-Gen-Plans repo:
     INSTALL_R4_FIXED.js
     INSTALL_R4_FIXED.bat
     VERIFY_R4_INSTALL.bat

2. Make sure r4-addon.js and r4-addon.css are already in that same root.
   They are present in your current pushed Git repo.

3. Run:
     INSTALL_R4_FIXED.bat

4. It must report:
     R4 INSTALL VERIFIED

5. Optionally run:
     VERIFY_R4_INSTALL.bat

6. Launch with your EXISTING corrected:
     START_NXT_GEN_PLANS.bat

DO NOT RUN THE OLD INSTALL_R4.bat / INSTALL_R4.js.

The fixed installer:
- explicitly reads UTF-8
- explicitly writes UTF-8 without BOM
- validates the original R3 HTML before writing
- does not duplicate R4 references
- verifies the finished file
- never modifies app.js
- never modifies START_NXT_GEN_PLANS.bat
