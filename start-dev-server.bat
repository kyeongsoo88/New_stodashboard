@echo off
chcp 65001 >nul
cd /d "%~dp0frontend"
echo Current directory: %CD%
if exist .next (
    echo Removing .next folder...
    rmdir /s /q .next
)
echo Starting development server...
call npm run dev
pause

