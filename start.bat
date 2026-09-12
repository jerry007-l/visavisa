@echo off
echo ========================================
echo   面签三分钟 - 本地服务器启动
echo ========================================
echo.

REM 检查 Python 是否安装
where python >nul 2>nul
if %errorlevel%==0 (
    echo [√] 检测到 Python
    echo [i] 正在启动 HTTP 服务器...
    echo [i] 请在浏览器访问: http://localhost:8000
    echo.
    cd /d "%~dp0\public"
    python -m http.server 8000
    pause
    goto :end
)

REM 检查 Node.js 是否安装
where node >nul 2>nul
if %errorlevel%==0 (
    echo [√] 检测到 Node.js
    echo [i] 正在启动 HTTP 服务器...
    echo [i] 请在浏览器访问: http://localhost:8080
    echo.
    cd /d "%~dp0\public"
    npx http-server -p 8080
    pause
    goto :end
)

REM 如果没有安装，显示手动说明
echo [×] 未检测到 Python 或 Node.js
echo [i] 请手动安装以下任一工具：
echo     1. Python: https://www.python.org/downloads/
echo     2. Node.js: https://nodejs.org/
echo.
echo [i] 或者直接在浏览器打开：
echo     file:///C:/Users/24041/Desktop/WeYoung/最终项目/public/index.html
echo.
pause

:end
echo.
echo ========================================
