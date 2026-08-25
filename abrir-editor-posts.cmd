@echo off
setlocal
cd /d "%~dp0"
title SolarisPKN - Editor local de posts
where node >nul 2>nul
if errorlevel 1 (
  echo No se encontro Node.js en PATH.
  echo Instala Node.js 22 o superior y volve a ejecutar este archivo.
  pause
  exit /b 1
)
node scripts\post-editor\server.js
if errorlevel 1 (
  echo.
  echo El editor termino con un error.
  pause
)
endlocal
