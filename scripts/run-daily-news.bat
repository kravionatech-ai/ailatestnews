@echo off
cd /d "G:\My Drive\KravionaInHouse\Bloging"
call npm run daily-news:auto >> "G:\My Drive\KravionaInHouse\Bloging\automation-cron.log" 2>&1
