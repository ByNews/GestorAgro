@echo off
cd /d "%~dp0"

echo ============================================================
echo      GESTOR AGRO 4.0 - INICIALIZACAO WEB
echo ============================================================
echo.

where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado no sistema.
    echo Instale o Node.js LTS em: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)

for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js encontrado: %NODE_VER%

if not exist ".env" (
    if exist "configuracoes\.env.exemplo" (
        copy /y "configuracoes\.env.exemplo" ".env" >nul
        echo [OK] Arquivo .env criado a partir do exemplo.
        echo Ajuste os dados do PostgreSQL se necessario.
        echo.
    )
) else (
    echo [OK] Arquivo .env ja existe.
)

echo Instalando dependencias...
call npm install
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

echo.
echo Iniciando o Gestor Agro Web...
echo Acesse em: http://localhost:4312
echo.
call npm start
