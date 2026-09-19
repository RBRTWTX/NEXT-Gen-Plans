@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R7

echo.
if not exist "%~dp0index.R6_1.before_R7.html" (
  echo ERROR: index.R6_1.before_R7.html was not found.
  pause
  exit /b 1
)
copy /y "%~dp0index.R6_1.before_R7.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore the pre-R7 index.html.
  pause
  exit /b 2
)
echo PASS: R7 disabled. R6.1 FIX2 remains intact.
echo.
pause
exit /b 0
