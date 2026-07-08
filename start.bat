@echo off
chcp 65001 >nul
echo ============================================
echo   🌌 宇宙科技风个人作品展示站
echo ============================================
echo.
echo [1/2] 安装依赖...
cd /d "%~dp0"
call npm install
echo.
echo [2/2] 启动服务器...
echo.
node server/index.js
pause
