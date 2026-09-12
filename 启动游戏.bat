@echo off
echo ====================================
echo   面签三分钟 - 单机版
echo   Visa Interview 3 Minutes
echo ====================================
echo.
echo 正在启动游戏服务器...
echo.

cd /d "%~dp0"

echo [1] 尝试使用 npm 启动...
if exist "node_modules\express" (
    echo   找到依赖，启动中...
    node server/src/index.js
    goto end
) else (
    echo   未找到依赖，正在安装...
    call npm install
    if errorlevel 1 (
        echo.
        echo [2] npm 启动失败，尝试直接打开HTML...
        start public\index.html
        echo 已直接在浏览器中打开！
        goto end
    )
)

:end
echo.
echo 游戏已启动！
echo 访问地址: http://localhost:3000
echo 或直接打开: public\index.html
echo.
pause
