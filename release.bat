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
echo 7. ������װ���ͱ�Я��...
call npm run dist:win
if %errorlevel% neq 0 (
    echo ������װ��ʧ�ܣ�
    pause
    exit /b 1
)

echo.
echo ================================
echo       ������ɣ�
echo ================================
echo ���ɵ��ļ��� dist-electron Ŀ¼:
echo - BetterKugou-1.0.0-Setup.exe    (��װ��)
echo - BetterKugou-1.0.0-Portable.exe (��Я��)
echo ================================

echo ������������Ŀ¼...
pause
start explorer dist-electron