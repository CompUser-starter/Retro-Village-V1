@echo off
chcp 65001 >nul
title Retro Kend - APK
cd /d "%~dp0"
echo.
echo  ==========================================
echo    Retro Kend - Android APK hazirlanir...
echo  ==========================================
node scripts\android-apk.mjs
echo.
pause
