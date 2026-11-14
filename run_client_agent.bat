@echo off
chcp 65001 >nul
title IT CARE - Real Client Agent
echo Starting Real Client Hardware Monitoring Agent...
cd /d "%~dp0"
if exist "%~dp0venv\Scripts\python.exe" (
    "%~dp0venv\Scripts\python.exe" client_agent.py
) else (
    python client_agent.py
)
pause
