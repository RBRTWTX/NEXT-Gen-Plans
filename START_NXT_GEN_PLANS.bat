@echo off
setlocal EnableExtensions
cd /d "%~dp0"

title NXT Gen Plans R3

set "APP=%~dp0index.html"
set "APPURL=file:///%APP:\=/%"

rem IMPORTANT:
rem A dedicated browser profile forces Edge/Chrome to start a separate process.
rem Without this, an already-running browser can ignore --allow-file-access-from-files.
set "EDGE_PROFILE=%LOCALAPPDATA%\NXTGenPlans\R3_LocalFile_Edge_V2"
set "CHROME_PROFILE=%LOCALAPPDATA%\NXTGenPlans\R3_LocalFile_Chrome_V2"

if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" ^
    --user-data-dir="%EDGE_PROFILE%" ^
    --allow-file-access-from-files ^
    --no-first-run ^
    --no-default-browser-check ^
    --app="%APPURL%" ^
    --start-maximized
  exit /b 0
)

if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" ^
    --user-data-dir="%EDGE_PROFILE%" ^
    --allow-file-access-from-files ^
    --no-first-run ^
    --no-default-browser-check ^
    --app="%APPURL%" ^
    --start-maximized
  exit /b 0
)

if exist "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" (
  start "" "%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe" ^
    --user-data-dir="%EDGE_PROFILE%" ^
    --allow-file-access-from-files ^
    --no-first-run ^
    --no-default-browser-check ^
    --app="%APPURL%" ^
    --start-maximized
  exit /b 0
)

if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" ^
    --user-data-dir="%CHROME_PROFILE%" ^
    --allow-file-access-from-files ^
    --no-first-run ^
    --no-default-browser-check ^
    --app="%APPURL%" ^
    --start-maximized
  exit /b 0
)

if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
  start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" ^
    --user-data-dir="%CHROME_PROFILE%" ^
    --allow-file-access-from-files ^
    --no-first-run ^
    --no-default-browser-check ^
    --app="%APPURL%" ^
    --start-maximized
  exit /b 0
)

echo.
echo ERROR: Microsoft Edge or Google Chrome was not found.
echo Expected app:
echo   %APP%
echo.
pause
exit /b 1
