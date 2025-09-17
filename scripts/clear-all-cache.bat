@echo off
echo ==========================================
echo 🧹 COMPLETE CACHE CLEANUP SCRIPT
echo ==========================================
echo.

REM 1. Next.js 캐시 삭제
echo [1/6] Clearing Next.js cache...
if exist ".next" (
    rmdir /s /q ".next"
    echo ✅ .next directory removed
) else (
    echo ⚠️  .next directory not found
)

REM 2. Node modules 캐시 삭제
echo.
echo [2/6] Clearing npm cache...
npm cache clean --force
echo ✅ npm cache cleared

REM 3. 빌드 아티팩트 삭제
echo.
echo [3/6] Clearing build artifacts...
if exist "dist" (
    rmdir /s /q "dist"
    echo ✅ dist directory removed
)
if exist "out" (
    rmdir /s /q "out"
    echo ✅ out directory removed
)

REM 4. TypeScript 캐시 삭제
echo.
echo [4/6] Clearing TypeScript cache...
if exist "tsconfig.tsbuildinfo" (
    del "tsconfig.tsbuildinfo"
    echo ✅ tsconfig.tsbuildinfo removed
)

REM 5. 임시 파일 삭제
echo.
echo [5/6] Clearing temporary files...
if exist "*.tmp" (
    del "*.tmp"
    echo ✅ Temporary files removed
)

REM 6. 프로세스 종료 및 재시작 안내
echo.
echo [6/6] Killing any running processes...
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im next.exe >nul 2>&1
echo ✅ Node processes killed

echo.
echo ==========================================
echo 🎉 CACHE CLEANUP COMPLETE!
echo ==========================================
echo.
echo 📋 Next steps:
echo 1. npm install (if needed)
echo 2. npm run dev
echo 3. Hard refresh browser (Ctrl+Shift+R)
echo 4. Clear browser data if still issues
echo.

REM 브라우저 캐시 클리어 안내
echo 🌐 BROWSER CACHE CLEANUP:
echo ----------------------------------------
echo Chrome: Ctrl+Shift+Delete → Clear browsing data
echo Firefox: Ctrl+Shift+Delete → Clear recent history  
echo Edge: Ctrl+Shift+Delete → Clear browsing data
echo.
echo Or use Incognito/Private mode for testing
echo.
pause