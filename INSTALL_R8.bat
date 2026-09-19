@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R8 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R8 - Combined Manual Production
echo ============================================================
echo.
echo Manual intersection details, templates, stationing,
echo print regions, schedules, and sheet management.
echo No automatic TCP layout generation.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R8.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R8 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R8 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
