@echo off
chcp 65001 >nul
title IT CARE - Simulation 30 Agents
echo Starting 30 Simulated Agents...
cd /d "%~dp0"
if exist "%~dp0venv\Scripts\python.exe" (
    "%~dp0venv\Scripts\python.exe" simulate_30_agents.py
) else (
    python simulate_30_agents.py
)
pause

