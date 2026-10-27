@echo off
title Brainiacs Attendance Server
cd /d "%~dp0"
echo Starting Attendance System Server...
call npm.cmd run dev
pause
