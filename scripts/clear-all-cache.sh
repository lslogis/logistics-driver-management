#!/bin/bash

echo "=========================================="
echo "🧹 COMPLETE CACHE CLEANUP SCRIPT"
echo "=========================================="
echo

# 1. Next.js 캐시 삭제
echo "[1/6] Clearing Next.js cache..."
if [ -d ".next" ]; then
    rm -rf .next
    echo "✅ .next directory removed"
else
    echo "⚠️  .next directory not found"
fi

# 2. Node modules 캐시 삭제
echo
echo "[2/6] Clearing npm cache..."
npm cache clean --force
echo "✅ npm cache cleared"

# 3. 빌드 아티팩트 삭제
echo
echo "[3/6] Clearing build artifacts..."
[ -d "dist" ] && rm -rf dist && echo "✅ dist directory removed"
[ -d "out" ] && rm -rf out && echo "✅ out directory removed"

# 4. TypeScript 캐시 삭제
echo
echo "[4/6] Clearing TypeScript cache..."
if [ -f "tsconfig.tsbuildinfo" ]; then
    rm tsconfig.tsbuildinfo
    echo "✅ tsconfig.tsbuildinfo removed"
fi

# 5. 임시 파일 삭제
echo
echo "[5/6] Clearing temporary files..."
find . -name "*.tmp" -delete 2>/dev/null && echo "✅ Temporary files removed"

# 6. 프로세스 종료
echo
echo "[6/6] Killing any running processes..."
pkill -f "next dev" 2>/dev/null || true
pkill -f "node.*next" 2>/dev/null || true
echo "✅ Node processes killed"

echo
echo "=========================================="
echo "🎉 CACHE CLEANUP COMPLETE!"
echo "=========================================="
echo
echo "📋 Next steps:"
echo "1. npm install (if needed)"
echo "2. npm run dev"
echo "3. Hard refresh browser (Ctrl+Shift+R)"
echo "4. Clear browser data if still issues"
echo

# 브라우저 캐시 클리어 안내
echo "🌐 BROWSER CACHE CLEANUP:"
echo "----------------------------------------"
echo "Chrome: Ctrl+Shift+Delete → Clear browsing data"
echo "Firefox: Ctrl+Shift+Delete → Clear recent history"
echo "Safari: Cmd+Option+E → Empty caches"
echo "Edge: Ctrl+Shift+Delete → Clear browsing data"
echo
echo "Or use Incognito/Private mode for testing"
echo