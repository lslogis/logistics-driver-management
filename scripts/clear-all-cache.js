const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('==========================================');
console.log('🧹 COMPLETE CACHE CLEANUP SCRIPT');
console.log('==========================================');
console.log('');

// Helper function to safely remove directory
function safeRmdir(dirPath, description) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ ${description} removed`);
      return true;
    } else {
      console.log(`⚠️  ${description} not found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to remove ${description}: ${error.message}`);
    return false;
  }
}

// Helper function to safely remove file
function safeUnlink(filePath, description) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`✅ ${description} removed`);
      return true;
    } else {
      console.log(`⚠️  ${description} not found`);
      return false;
    }
  } catch (error) {
    console.log(`❌ Failed to remove ${description}: ${error.message}`);
    return false;
  }
}

// Helper function to execute command safely
function safeExec(command, description) {
  try {
    execSync(command, { stdio: 'pipe' });
    console.log(`✅ ${description} completed`);
    return true;
  } catch (error) {
    console.log(`❌ Failed to ${description}: ${error.message}`);
    return false;
  }
}

async function clearAllCache() {
  // 1. Next.js 캐시 삭제
  console.log('[1/8] Clearing Next.js cache...');
  safeRmdir('.next', '.next directory');
  
  console.log('');
  
  // 2. npm 캐시 삭제
  console.log('[2/8] Clearing npm cache...');
  safeExec('npm cache clean --force', 'npm cache clear');
  
  console.log('');
  
  // 3. 빌드 아티팩트 삭제
  console.log('[3/8] Clearing build artifacts...');
  safeRmdir('dist', 'dist directory');
  safeRmdir('out', 'out directory');
  safeRmdir('build', 'build directory');
  
  console.log('');
  
  // 4. TypeScript 캐시 삭제
  console.log('[4/8] Clearing TypeScript cache...');
  safeUnlink('tsconfig.tsbuildinfo', 'tsconfig.tsbuildinfo');
  
  console.log('');
  
  // 5. Jest 캐시 삭제
  console.log('[5/8] Clearing Jest cache...');
  safeExec('npx jest --clearCache', 'Jest cache clear');
  
  console.log('');
  
  // 6. Playwright 캐시 삭제 
  console.log('[6/8] Clearing Playwright cache...');
  safeRmdir('test-results', 'Playwright test results');
  safeRmdir('playwright-report', 'Playwright HTML report');
  
  console.log('');
  
  // 7. 임시 파일 삭제
  console.log('[7/8] Clearing temporary files...');
  try {
    const files = fs.readdirSync('.');
    const tmpFiles = files.filter(file => file.endsWith('.tmp') || file.endsWith('.log'));
    tmpFiles.forEach(file => {
      safeUnlink(file, `temporary file ${file}`);
    });
    if (tmpFiles.length === 0) {
      console.log('⚠️  No temporary files found');
    }
  } catch (error) {
    console.log(`❌ Failed to scan for temporary files: ${error.message}`);
  }
  
  console.log('');
  
  // 8. 프로세스 종료 (Windows)
  console.log('[8/8] Killing any running processes...');
  if (process.platform === 'win32') {
    safeExec('taskkill /f /im node.exe 2>nul', 'Node process termination');
    safeExec('taskkill /f /im next.exe 2>nul', 'Next.js process termination');
  } else {
    safeExec('pkill -f "next dev" 2>/dev/null || true', 'Next.js process termination');
    safeExec('pkill -f "node.*next" 2>/dev/null || true', 'Node process termination');
  }
  
  console.log('');
  console.log('==========================================');
  console.log('🎉 CACHE CLEANUP COMPLETE!');
  console.log('==========================================');
  console.log('');
  console.log('📋 Next steps:');
  console.log('1. npm install (if needed)');
  console.log('2. npm run dev');
  console.log('3. Hard refresh browser (Ctrl+Shift+R)');
  console.log('4. Clear browser data if still issues');
  console.log('');
  
  // 브라우저 캐시 클리어 안내
  console.log('🌐 BROWSER CACHE CLEANUP:');
  console.log('----------------------------------------');
  console.log('Chrome: Ctrl+Shift+Delete → Clear browsing data');
  console.log('Firefox: Ctrl+Shift+Delete → Clear recent history');
  console.log('Safari: Cmd+Option+E → Empty caches');
  console.log('Edge: Ctrl+Shift+Delete → Clear browsing data');
  console.log('');
  console.log('Or use Incognito/Private mode for testing');
  console.log('');
  
  // 추가 개발자 팁
  console.log('💡 DEVELOPER TIPS:');
  console.log('----------------------------------------');
  console.log('• Use "npm run dev:fresh" for clean development start');
  console.log('• Set browser to disable cache in DevTools');
  console.log('• Use different browser profiles for testing');
  console.log('• Check NEXTAUTH_URL environment variable');
  console.log('• Restart your IDE/editor after cache clear');
  console.log('');
}

// Run the cleanup
clearAllCache().catch(console.error);