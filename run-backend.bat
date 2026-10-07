@echo off
title Gym Duong Double - Backend (Spring Boot :8080)
cd /d "%~dp0backend"
powershell -NoProfile -ExecutionPolicy Bypass -File .\run-backend.ps1
pause
