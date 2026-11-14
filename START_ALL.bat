@echo off
chcp 65001 >nul
title IT CARE - Launcher
cd /d "%~dp0"

echo ===================================================
echo          STARTING ALL IT CARE SERVICES
echo ===================================================
echo [1/4] Launching Backend Server (Port 8000)...
start "IT CARE - Backend" cmd /c "run_backend.bat"
timeout /t 3 /nobreak >nul

echo [2/4] Launching Frontend Web (Port 3000)...
start "IT CARE - Frontend" cmd /c "run_frontend.bat"
timeout /t 5 /nobreak >nul

echo [3/4] Launching 30 Simulation Agents...
start "IT CARE - Simulation" cmd /c "run_simulation.bat"
timeout /t 2 /nobreak >nul

echo [4/4] Launching Cloudflare Public HTTPS Tunnel...
start "IT CARE - Public Tunnel" cmd /c "run_cloud_tunnel.bat"

echo ===================================================
echo All services launched in separate windows!
echo - Local Dashboard : http://localhost:3000
echo - Public Dashboard: ดูลิงก์ https://...trycloudflare.com ในหน้าต่าง Tunnel
echo ===================================================
pause
