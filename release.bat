@echo off
echo ================================
echo   BetterKugou ���������ű�
echo ================================

echo 1. ��黷��...
where npm >nul 2>&1
if %errorlevel% neq 0 (
    echo ����: δ�ҵ� npm�����Ȱ�װ Node.js
    pause
    exit /b 1
)

echo.
echo 2. ����Ӧ��ͼ��...
node scripts/create-icon.js

echo.
echo 3. ��װǰ������...
call npm install
if %errorlevel% neq 0 (
    echo ��װǰ������ʧ�ܣ�
    pause
    exit /b 1
)

echo.
echo 4. ����ǰ��...
call npm run build
if %errorlevel% neq 0 (
    echo ����ǰ��ʧ�ܣ�
    pause
    exit /b 1
)

echo.
echo 5. ���ƺ���ļ�...
call npm run copy-backend-simple
if %errorlevel% neq 0 (
    echo ���ƺ���ļ�ʧ�ܣ�
    pause
    exit /b 1
)

echo.
echo 6. ��װ�������...
call npm run install-backend-deps
if %errorlevel% neq 0 (
    echo ��װ�������ʧ�ܣ�
    pause
    exit /b 1
)

echo.

echo 7. ��ѡ����ƽ̨��
echo   1. �� Windows (x64/ia32/arm64)
echo   2. Windows + Linux
echo   3. Windows + Linux + macOS (�� macOS ����)
set /p platform=������ѡ�����ֲ��س�: 

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
    echo ѡ����Ч��Ĭ�Ͻ���� Windows��
    call npm run dist:win
    set build_result=%errorlevel%
)

if %build_result% neq 0 (
    :build_fail
    echo ������װ��ʧ�ܣ�
    pause
    exit /b 1
)

echo.
echo ================================
echo       ������ɣ�
echo ================================

echo ���ɵ��ļ��� dist-electron Ŀ¼:
echo - Windows: BetterKugou-*.exe (Setup/Portable)
echo - Linux:   BetterKugou-*.AppImage / *.deb / *.rpm
echo - macOS:   BetterKugou-*.dmg / *.zip
echo ================================

echo ������������Ŀ¼...
pause
start explorer dist-electron