@echo off
echo ================================
echo   BetterKugou 完整发布脚本
echo ================================

echo 1. 检查环境...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo 错误: 未找到 npm，请先安装 Node.js
    pause
    exit /b 1
)

echo.
echo 2. 创建应用图标...
node scripts/create-icon.js

echo.
echo 3. 安装前端依赖...
call npm install
if %errorlevel% neq 0 (
    echo 安装前端依赖失败！
    pause
    exit /b 1
)

echo.
echo 4. 构建前端...
call npm run build
if %errorlevel% neq 0 (
    echo 构建前端失败！
    pause
    exit /b 1
)

echo.
echo 5. 复制后端文件...
call npm run copy-backend-simple
if %errorlevel% neq 0 (
    echo 复制后端文件失败！
    pause
    exit /b 1
)

echo.
echo 6. 安装后端依赖...
call npm run install-backend-deps
if %errorlevel% neq 0 (
    echo 安装后端依赖失败！
    pause
    exit /b 1
)

echo.
echo 7. 创建安装包和便携版...
call npm run dist:win
if %errorlevel% neq 0 (
    echo 创建安装包失败！
    pause
    exit /b 1
)

echo.
echo ================================
echo       发布完成！
echo ================================
echo 生成的文件在 dist-electron 目录:
echo - BetterKugou-1.0.0-Setup.exe    (安装包)
echo - BetterKugou-1.0.0-Portable.exe (便携版)
echo ================================

echo 按任意键打开输出目录...
pause
start explorer dist-electron