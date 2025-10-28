
//  QMatch Electron Main Process (2025-10 최신 안정 버전)

require('dotenv').config(); // .env 파일 로드
const { app, BrowserWindow, session, protocol, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const originalRequire = Module.createRequire(__filename);

// ✅ 환경변수 로드
const FRONT_DOMAIN = process.env.FRONT_DOMAIN || 'yjs0511.synology.me';
console.log(`🌐 FRONT_DOMAIN: ${FRONT_DOMAIN}`);

let psList;

// ps-list 안전 로드 (asar / unpacked 환경 호환)
try {
  const unpackedPath = path.join(
    process.resourcesPath,
    'app.asar.unpacked',
    'node_modules',
    'ps-list',
    'index.js'
  );
  const psListModule = originalRequire(unpackedPath);
  psList = psListModule.default || psListModule;
  console.log('✅ ps-list 로드 경로:', unpackedPath);
} catch (e) {
  psList = require('ps-list').default;
  console.log('⚙️ ps-list fallback to default require');
}

// 쿠키 정책 수정 (SameSite, Secure, Domain 교정)
function configureSession() {
  const filter = { urls: ['http://*/*', 'https://*/*'] };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const originalCookies = details.responseHeaders['set-cookie'] || [];

    const fixedCookies = originalCookies.map((cookie) => {
      let c = cookie
        .replace(/SameSite=Lax/gi, 'SameSite=None')
        .replace(/SameSite=Strict/gi, 'SameSite=None')
        .replace(/;\s*Secure/gi, ''); // Secure 제거

      // Domain 강제 지정
      if (/Domain=/i.test(c)) c = c.replace(/Domain=[^;]+/i, `Domain=${FRONT_DOMAIN}`);
      else c += `; Domain=${FRONT_DOMAIN}`;

      // Path 기본값 추가
      if (!/Path=/i.test(c)) c += '; Path=/';

      return c;
    });

    if (fixedCookies.length > 0) {
      details.responseHeaders['set-cookie'] = fixedCookies;
      console.log('🍪 Electron 쿠키 수정됨:', fixedCookies);
    }

    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });
}

// BrowserWindow 생성
function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false, // Cross-Origin 쿠키 허용
      allowRunningInsecureContent: true, // app:// → http:// 허용
    },
    icon: path.join(__dirname, 'assets', 'qmatchLogo.png'),
  });

  win.setMenu(null);

  const startURL = app.isPackaged ? 'app://index.html' : 'http://localhost:5173';
  win.loadURL(startURL);
  console.log('🚀 로드 대상 URL:', startURL);

  if (app.isPackaged) win.webContents.openDevTools({ mode: 'detach' });
}

// app:// 프로토콜 등록
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      allowServiceWorkers: true,
    },
  },
]);

// 초기화
app.whenReady().then(() => {
  console.log('🟢 Electron Ready');

  // 1️⃣ configureSession 등록
  configureSession();

  // 2️⃣ app:// 프로토콜 핸들러
  const webBuildPath = app.isPackaged
    ? path.join(app.getAppPath(), 'web-build')
    : path.join(__dirname, 'web-build');

  console.log('📦 정적 파일 경로:', webBuildPath);

  protocol.registerBufferProtocol('app', (request, respond) => {
    try {
      const url = new URL(request.url);
      let relativePath = url.pathname.replace(/^\/+/, '');
      if (!relativePath) relativePath = 'index.html';
      const filePath = path.join(webBuildPath, relativePath);

      const ext = path.extname(filePath).toLowerCase();
      const mimeTypes = {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
        '.ico': 'image/x-icon',
      };

      const mimeType = mimeTypes[ext] || 'text/plain';
      const data = fs.readFileSync(filePath);
      respond({ mimeType, data });
    } catch (err) {
      console.error('❌ 파일 로드 실패:', err);
      respond({ statusCode: 404 });
    }
  });

  // 3️⃣ 창 생성
  createWindow();
});

// ps-list IPC
ipcMain.handle('get-process-list', async () => {
  try {
    return await psList();
  } catch (err) {
    console.error('❌ 프로세스 목록 가져오기 실패:', err);
    throw err;
  }
});


// 종료 처리

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
