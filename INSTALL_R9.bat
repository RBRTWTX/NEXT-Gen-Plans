@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans 0.1 R9 Installer

echo.
echo ============================================================
echo  NXT Gen Plans 0.1 R9 - Universal Manual Geometry
echo ============================================================
echo.
echo Multi-select, grouping, editable paths, control points,
echo snapping, manual offset geometry, and appearance tools.
echo No automatic TCP layout or cloud/map integration.
echo.

cscript //nologo //E:JScript "%~dp0INSTALL_R9.js"
set "RC=%ERRORLEVEL%"

echo.
if not "%RC%"=="0" (
  echo R9 INSTALL FAILED.
  pause
  exit /b %RC%
)

echo ============================================================
echo  R9 INSTALL VERIFIED
echo ============================================================
echo.
echo Launch with START_NXT_GEN_PLANS.bat.
echo.
pause
exit /b 0
