@echo off
chcp 65001 >nul
title IT CARE - Launcher
echo ===================================================
echo          STARTING ALL IT CARE SERVICES
echo ===================================================
echo [1/3] Launching Backend Server (Port 8000)...
start "IT CARE - Backend" cmd /k ""%~dp0run_backend.bat""
timeout /t 3 /nobreak >nul
echo [2/3] Launching Frontend Web (Port 3000)...
start "IT CARE - Frontend" cmd /k ""%~dp0run_frontend.bat""
timeout /t 5 /nobreak >nul
echo [3/3] Launching 30 Simulation Agents...
start "IT CARE - Simulation" cmd /k ""%~dp0run_simulation.bat""
echo ===================================================
echo All services launched in separate windows!
echo Open your browser at: http://localhost:3000
echo ===================================================
pause
