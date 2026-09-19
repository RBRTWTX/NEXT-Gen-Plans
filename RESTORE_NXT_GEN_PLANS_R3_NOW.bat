@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Restore R3

echo.
echo NXT Gen Plans - Emergency R3 Restore
echo -------------------------------------
echo.

if not exist "%~dp0index.R3.before_R4.html" (
  echo ERROR: index.R3.before_R4.html was not found in this folder.
  echo.
  echo Do NOT make any more changes.
  echo Open GitHub Desktop and discard ONLY the change to index.html,
  echo or restore index.html from the last known-good commit.
  echo.
  pause
  exit /b 1
)

copy /y "%~dp0index.R3.before_R4.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Windows could not restore index.html.
  echo.
  pause
  exit /b 2
)

echo PASS: R3 index.html has been restored byte-for-byte from the pre-R4 backup.
echo.
echo R4 add-on files may remain in the folder, but they are NOT loaded by the restored R3 index.
echo Your app.js, MUTCD SVG library, and START_NXT_GEN_PLANS.bat were not changed by this restore.
echo.
echo Now close the broken browser window and launch with your WORKING START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
