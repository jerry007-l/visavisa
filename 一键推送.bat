@echo off
chcp 65001 > nul
echo ========================================
echo   推送到 visavisa 仓库
echo ========================================
echo.

cd /d "%~dp0"

echo 正在进入项目目录...
echo cd "c:\Users\24041\Desktop\WeYoung\最终项目最终的最终版"
cd "c:\Users\24041\Desktop\WeYoung\最终项目最终的最终版"

echo.
echo 设置远程仓库地址...
git remote set-url origin https://github.com/jerry007-l/visavisa.git

echo.
echo 正在推送到 GitHub，请稍候...
echo.
git push origin main

echo.
echo ========================================
if %errorlevel% equ 0 (
    echo   ✅ 推送成功！
    echo.
    echo 现在访问以下链接即可玩游戏：
    echo   https://jerry007-l.github.io/visavisa/test_game.html
) else (
    echo   ❌ 推送失败
    echo.
    echo 请检查网络连接或稍后重试
)
echo ========================================
echo.
pause
