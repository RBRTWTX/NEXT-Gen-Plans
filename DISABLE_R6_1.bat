@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans - Disable R6.1

echo.
if not exist "%~dp0index.R6.before_R6_1.html" (
  echo ERROR: index.R6.before_R6_1.html not found.
  pause
  exit /b 1
)
copy /y "%~dp0index.R6.before_R6_1.html" "%~dp0index.html" >nul
if errorlevel 1 (
  echo ERROR: Could not restore pre-R6.1 index.html.
  pause
  exit /b 2
)
echo PASS: R6.1 disabled. R3/R4/R5/R6 remain intact.
echo.
pause
exit /b 0
