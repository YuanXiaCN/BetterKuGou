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

echo 7. 请选择打包平台：
echo   1. 仅 Windows (x64/ia32/arm64)
echo   2. Windows + Linux
echo   3. Windows + Linux + macOS (需 macOS 环境)
set /p platform=请输入选项数字并回车: 

if "%platform%"=="1" (
    call npm run dist:win
    set build_result=%errorlevel%
) else if "%platform%"=="2" (
    call npm run dist:win
    if %errorlevel% neq 0 goto build_fail
    call npm run dist:linux
    set build_result=%errorlevel%
) else if "%platform%"=="3" (
    call npm run dist:all
    set build_result=%errorlevel%
) else (
    echo 选项无效，默认仅打包 Windows。
    call npm run dist:win
    set build_result=%errorlevel%
)

if %build_result% neq 0 (
    :build_fail
    echo 创建安装包失败！
    pause
    exit /b 1
)

echo.
echo ================================
echo       发布完成！
echo ================================

echo 生成的文件在 dist-electron 目录:
echo - Windows: BetterKugou-*.exe (Setup/Portable)
echo - Linux:   BetterKugou-*.AppImage / *.deb / *.rpm
echo - macOS:   BetterKugou-*.dmg / *.zip
echo ================================

echo 按任意键打开输出目录...
pause
start explorer dist-electron