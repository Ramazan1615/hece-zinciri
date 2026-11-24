@echo off
title Hece Zinciri PRO - 7/24 Sunucu ve Sabit Ngrok Tuneli
echo ========================================================
echo   HECE ZINCIRI PRO - 7/24 SUNUCU VE SABIT NGROK TUNELI
echo   Sabit Adres: https://phoniness-unmasked-rebalance.ngrok-free.dev
echo ========================================================
taskkill /F /IM BinanceAlgoBot.exe >nul 2>&1
taskkill /F /IM ngrok.exe >nul 2>&1
node server.mjs
pause
