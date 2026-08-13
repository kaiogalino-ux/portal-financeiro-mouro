@echo off
cd /d "C:\Users\kaio.Pereira\Desktop\Finance Analyst\portal"
echo ---- %date% %time% ---- >> "C:\Users\kaio.Pereira\Desktop\Finance Analyst\portal\sync-diario.log"
call "C:\Program Files\nodejs\npm.cmd" run sync:diario >> "C:\Users\kaio.Pereira\Desktop\Finance Analyst\portal\sync-diario.log" 2>&1
