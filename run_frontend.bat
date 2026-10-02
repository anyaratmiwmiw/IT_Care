@echo off
chcp 65001 >nul
title IT CARE - Frontend Web (Port 3000)
echo Starting IT CARE Frontend Web on 0.0.0.0:3000...
cd /d "%~dp0it-care-frontend"
cmd.exe /c npx next dev -H 0.0.0.0 -p 3000
pause
