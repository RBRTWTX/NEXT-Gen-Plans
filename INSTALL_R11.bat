@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R11 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R11 - Manual Plan Documentation
echo ============================================================
echo.
echo Title blocks, revisions, manual tables, legend/manifest
echo snapshots, sequential stamps, notes, and references.
echo No automatic TCP design or cloud/map integration.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R11.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R11 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R11 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
