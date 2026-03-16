@echo off
REM BP Monitor Backup Script for Windows
REM Run this manually or schedule with Windows Task Scheduler

echo Starting BP Monitor backup...

node backup.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo Backup completed successfully!
) else (
    echo.
    echo Backup failed! Check the error messages above.
)

pause
