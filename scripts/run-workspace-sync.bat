@echo off
cd /d "G:\My Drive\KravionaInHouse\Bloging"
call npm run workspace:sync >> "G:\My Drive\KravionaInHouse\Bloging\workspace-sync-cron.log" 2>&1
