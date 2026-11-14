@echo off
chcp 65001 >nul
title IT CARE - Cloudflare Public Tunnel
cd /d "%~dp0"
echo ===================================================
echo     IT CARE - CLOUDFLARE PUBLIC HTTPS TUNNEL
echo ===================================================
echo กำลังเปิดช่องทาง Public HTTPS ผ่าน Cloudflare Tunnel...
echo เมื่อเปิดสำเร็จ จะมีลิงก์ HTTPS แสดงขึ้นมาด้านล่าง
echo ช่างเทคนิคสามารถสแกน QR Code จากมือถือ 4G/5G เข้ามาได้ทันที
echo ===================================================
echo.
cloudflared.exe tunnel --url http://localhost:3000
pause
