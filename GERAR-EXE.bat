@echo off
title Gestor Agro — Gerando executavel...
color 0A

echo.
echo  ==========================================
echo    GESTOR AGRO v11 — Geracao do .exe
echo  ==========================================
echo.

:: Verifica Node.js
node --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
  echo  [ERRO] Node.js nao encontrado.
  echo  Baixe em: https://nodejs.org
  pause
  exit /b 1
)

echo  [1/3] Instalando dependencias...
call npm install
IF %ERRORLEVEL% NEQ 0 (
  echo  [ERRO] Falha no npm install.
  pause
  exit /b 1
)

echo.
echo  [2/3] Compilando executavel Windows (.exe)...
call npm run build:exe
IF %ERRORLEVEL% NEQ 0 (
  echo  [ERRO] Falha na geracao do executavel.
  pause
  exit /b 1
)

echo.
echo  [3/3] Concluido!
echo.
echo  O instalador foi gerado na pasta:
echo    distribuicao\GestorAgro-Setup-4.0.0.exe
echo.
echo  Basta executar o .exe para instalar o sistema.
echo.
pause
