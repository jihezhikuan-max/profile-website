@echo off
setlocal
title Profile Website - Local Preview
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0serve-local.ps1"
if errorlevel 1 (
  echo.
  echo Could not start the preview. See the message above and README.md.
  pause
)
endlocal
