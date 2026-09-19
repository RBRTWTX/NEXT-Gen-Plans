@echo off
setlocal EnableExtensions
cd /d "%~dp0"
title NXT Gen Plans R4 - Install Verification

echo.
echo NXT Gen Plans R4 - Verification
echo --------------------------------
echo.

if not exist "%~dp0index.html" (
  echo FAIL: index.html is missing.
  pause
  exit /b 1
)

findstr /C:"<!doctype html>" "%~dp0index.html" >nul
if errorlevel 1 (
  findstr /C:"<!DOCTYPE html>" "%~dp0index.html" >nul
  if errorlevel 1 (
    echo FAIL: index.html does not contain a valid HTML doctype.
    pause
    exit /b 2
  )
)

findstr /C:"r4-addon.css" "%~dp0index.html" >nul
if errorlevel 1 (
  echo FAIL: r4-addon.css is not referenced by index.html.
  pause
  exit /b 3
)

findstr /C:"r4-addon.js" "%~dp0index.html" >nul
if errorlevel 1 (
  echo FAIL: r4-addon.js is not referenced by index.html.
  pause
  exit /b 4
)

if not exist "%~dp0r4-addon.css" (
  echo FAIL: r4-addon.css file is missing.
  pause
  exit /b 5
)

if not exist "%~dp0r4-addon.js" (
  echo FAIL: r4-addon.js file is missing.
  pause
  exit /b 6
)

echo PASS: index.html still contains a valid HTML doctype.
echo PASS: r4-addon.css is linked.
echo PASS: r4-addon.js is linked.
echo PASS: R4 add-on files exist.
echo.
echo This verifier does not change any files.
echo.
pause
exit /b 0
