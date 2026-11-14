@echo off
chcp 65001 >nul
title IT CARE - Backend Server
echo Starting IT CARE Backend Server (Port 8000 on 0.0.0.0)...
cd /d "%~dp0"
if exist "%~dp0venv\Scripts\python.exe" (
    "%~dp0venv\Scripts\python.exe" -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
) else (
    python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
)
pause

