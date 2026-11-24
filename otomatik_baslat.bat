@echo off
title Hece Zinciri PRO (7/24 Kesintisiz Calisma ve Tunel Modu)
cd /d "C:\Users\user\.gemini\antigravity\scratch\hece-zinciri"

echo ================================================================
echo    HECE ZINCIRI PRO - 7/24 KESINTISIZ SUNUCU VE HTTPS TUNELI
echo ================================================================
echo Oyun sunucusu ve 7/24 Cloudflare / Ngrok HTTPS tuneli baslatiliyor...
echo Herhangi bir kapanma durumunda otomatik olarak tekrar acilacaktir.
echo.

:loop
echo [%date% %time%] Hece Zinciri PRO 7/24 Sunucusu baslatiliyor...
node server.mjs
echo.
echo [%date% %time%] UYARI: Sunucu kapandi! 2 saniye icinde otomatik yeniden baslatiliyor...
timeout /t 2 /nobreak >nul
goto loop
