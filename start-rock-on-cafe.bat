@echo off
title Rock On Cafe - Restaurant Ordering System
echo ========================================================
echo   🎸 ROCK ON CAFE - RESTAURANT ORDERING SYSTEM
echo ========================================================
echo.
echo Starting Server on http://localhost:3000 ...
echo.
echo Customer Menu: http://localhost:3000/#customer
echo Admin Portal:  http://localhost:3000/#admin
echo Default Admin: admin / admin123
echo.
echo Press Ctrl+C anytime to stop the server.
echo ========================================================
echo.

node server/index.js
pause
