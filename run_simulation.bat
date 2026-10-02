@echo off
chcp 65001 >nul
title IT CARE - Simulation 30 Agents
echo Starting 30 Simulated Agents...
cd /d "%~dp0"
python simulate_30_agents.py
pause
