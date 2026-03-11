@echo off
cd /d "%~dp0"

echo ============================================================
echo      GESTOR AGRO 4.0 - Instalador Automatico
echo ============================================================
echo.

:: 1. Verificar Node.js
where node >nul 2>&1
if errorlevel 1 (
    echo [ERRO] Node.js nao encontrado no sistema.
    echo.
    echo  Instale o Node.js LTS em: https://nodejs.org/pt/download
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%v in ('node -v') do set NODE_VER=%%v
echo [OK] Node.js encontrado: %NODE_VER%

:: 2. Copiar .env se ainda nao existir
if not exist ".env" (
    if exist "configuracoes\.env.exemplo" (
        copy /y "configuracoes\.env.exemplo" ".env" >nul
        echo [OK] Arquivo .env criado a partir do exemplo.
        echo.
        echo  ATENCAO: Edite o arquivo .env com os dados do PostgreSQL
        echo  se necessario. Configuracoes padrao:
        echo  host=localhost  porta=5432  usuario=postgres
        echo  senha=postgres  banco=farmmanager
        echo.
    )
) else (
    echo [OK] Arquivo .env ja existe.
)

:: 3. Instalar dependencias
echo Instalando dependencias (pode demorar alguns minutos)...
call npm install
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao instalar dependencias.
    pause
    exit /b 1
)
echo [OK] Dependencias instaladas.

:: 4. Limpar cache do electron-builder
if exist "%LOCALAPPDATA%\electron-builder\Cache" (
    rmdir /s /q "%LOCALAPPDATA%\electron-builder\Cache"
    echo [OK] Cache do electron-builder limpo.
)

:: 5. Gerar executavel
echo.
echo Gerando instalador do Gestor Agro (aguarde)...
set CSC_IDENTITY_AUTO_DISCOVERY=false
call npm run build:exe
if errorlevel 1 (
    echo.
    echo [ERRO] Falha ao gerar o executavel.
    pause
    exit /b 1
)

:: 6. Concluido
echo.
echo ============================================================
echo  Pronto! O instalador foi gerado na pasta "distribuicao".
echo ============================================================
echo.
if exist "distribuicao" (
    explorer distribuicao
)
pause
