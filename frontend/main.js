
//  QMatch Electron Main Process (2025-11-1 최신 안정 버전)

require('dotenv').config(); // .env 파일 로드
const { app, BrowserWindow, session, protocol, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');
const Module = require('module');
const originalRequire = Module.createRequire(__filename);

// 로그 파일 저장 (디버깅용)
const logFile = path.join(app.getPath('userData'), 'electron-main.log');
function logToFile(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  try {
    fs.appendFileSync(logFile, logMessage, 'utf8');
  } catch (err) {
    // 로그 파일 쓰기 실패 시 무시
  }
}

// console.log를 오버라이드하여 파일에도 저장
const originalLog = console.log;
const originalError = console.error;
const originalWarn = console.warn;

console.log = (...args) => {
  originalLog(...args);
  logToFile(`[LOG] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
};

console.error = (...args) => {
  originalError(...args);
  logToFile(`[ERROR] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
};

console.warn = (...args) => {
  originalWarn(...args);
  logToFile(`[WARN] ${args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ')}`);
};

console.log(`📝 로그 파일 위치: ${logFile}`);

// ✅ 환경변수 로드
const FRONT_DOMAIN = process.env.FRONT_DOMAIN;
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

// 쿠키 정책 수정 및 저장 (SameSite, Secure, Domain 교정)
function configureSession() {
  const filter = { urls: ['http://*/*', 'https://*/*'] };

  session.defaultSession.webRequest.onBeforeSendHeaders(filter, async (details, callback) => {
    // 요청 헤더에 쿠키가 없는 경우 Electron 세션에서 쿠키 가져와서 추가
    if (!details.requestHeaders.Cookie && !details.requestHeaders.cookie) {
      try {
        const urlObj = new URL(details.url);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        const cookies = await session.defaultSession.cookies.get({ url: baseUrl });
        
        if (cookies.length > 0) {
          const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
          details.requestHeaders.Cookie = cookieHeader;
        }
      } catch (err) {
        console.error(`❌ [webRequest] 쿠키 주입 실패:`, err);
      }
    }
    callback({ requestHeaders: details.requestHeaders });
  });

  session.defaultSession.webRequest.onHeadersReceived(filter, async (details, callback) => {
    // 모든 헤더 키를 소문자로 확인 (Electron이 소문자로 변환할 수 있음)
    const responseHeaders = details.responseHeaders || {};
    
    // set-cookie 헤더 찾기 (모든 가능한 변형 확인)
    let originalCookies = [];
    for (const key of Object.keys(responseHeaders)) {
      const lowerKey = key.toLowerCase();
      if (lowerKey === 'set-cookie' || lowerKey === 'setcookie') {
        const value = responseHeaders[key];
        originalCookies = Array.isArray(value) ? value : [value];
        break;
      }
    }

    if (originalCookies.length > 0) {
      // 쿠키를 수정하고 Electron 세션에 저장
      const fixedCookies = originalCookies.map((cookie) => {
        let c = cookie
          .replace(/SameSite=Lax/gi, 'SameSite=None')
          .replace(/SameSite=Strict/gi, 'SameSite=None')
          .replace(/;\s*Secure/gi, '')          // Secure 제거
          .replace(/Domain=[^;]+/gi, '');       // Domain 완전 제거

        // Path 기본값 추가
        if (!/Path=/i.test(c)) c += '; Path=/';

        return c;
      });

      details.responseHeaders['set-cookie'] = fixedCookies;

      // 쿠키를 Electron 세션에 직접 저장
      try {
        const urlObj = new URL(details.url);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        
        for (const cookieString of fixedCookies) {
          // 쿠키 문자열을 파싱하여 Electron Cookie 객체로 변환
          const cookieParts = cookieString.split(';').map(s => s.trim());
          const firstPart = cookieParts[0];
          const equalIndex = firstPart.indexOf('=');
          
          if (equalIndex === -1) continue;
          
          const name = firstPart.substring(0, equalIndex).trim();
          const value = firstPart.substring(equalIndex + 1).trim();
          
          if (!name || !value) continue;
          
          // Electron cookies.set()에서는 domain을 지정하지 않는 것이 더 안전함
          const cookieObj = {
            url: baseUrl, // 전체 URL (프로토콜 + 도메인 + 포트)
            name: name,
            value: value,
            // domain 필드는 생략 (Electron이 자동으로 처리)
            path: '/',
            secure: false, // HTTP 환경에서는 false
            httpOnly: true,
            // HTTP 환경에서는 sameSite를 unspecified로 설정 (no_restriction은 secure: true 필요)
            sameSite: 'unspecified', // HTTP 환경에서 사용
          };

          // 쿠키 설정 정보 파싱
          for (let i = 1; i < cookieParts.length; i++) {
            const part = cookieParts[i].toLowerCase();
            if (part.startsWith('path=')) {
              cookieObj.path = cookieParts[i].substring(5).trim();
            } else if (part === 'httponly') {
              cookieObj.httpOnly = true;
            } else if (part === 'secure') {
              cookieObj.secure = true;
            }
          }

          await session.defaultSession.cookies.set(cookieObj);
        }
      } catch (err) {
        console.error('❌ 쿠키 저장 실패:', err);
      }
    }

    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });

  // 응답 완료 후 쿠키 확인 (로그인 실패 시 디버깅용)
  session.defaultSession.webRequest.onCompleted(filter, async (details) => {
    if (details.url.includes('/api/loginProc') && details.statusCode === 200) {
      try {
        await new Promise(resolve => setTimeout(resolve, 100));
        const urlObj = new URL(details.url);
        const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
        const cookies = await session.defaultSession.cookies.get({ url: baseUrl });
        
        if (cookies.length === 0) {
          console.warn(`⚠️ [onCompleted] 로그인 후 쿠키가 저장되지 않았습니다.`);
        }
      } catch (err) {
        console.error('❌ [onCompleted] 쿠키 확인 실패:', err);
      }
    }
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
  
  // 로그 파일 위치를 창에 표시
  console.log('📝 Electron 로그 파일 위치:', logFile);

  if (!app.isPackaged) {
    win.webContents.openDevTools({ mode: 'detach' });
    
    // IPC로 로그 파일 위치 제공
    ipcMain.handle('get-log-file-path', () => {
      return logFile;
    });
  }
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
    ? path.join(app.getAppPath(), 'web-build') // 패키징 시 app.asar/web-build
    : path.join(__dirname, 'web-build'); // 개발 시 web-build 폴더

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

// 쿠키 저장 IPC (렌더러 프로세스에서 호출)
ipcMain.handle('set-cookies', async (event, url, cookieStrings) => {
  try {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    
    for (const cookieString of cookieStrings) {
      try {
        // 쿠키 문자열 파싱
        const cookieParts = cookieString.split(';').map(s => s.trim());
        const firstPart = cookieParts[0];
        const equalIndex = firstPart.indexOf('=');
        
        if (equalIndex === -1) {
          console.warn('⚠️ [IPC] 쿠키 파싱 실패 (등호 없음):', cookieString);
          continue;
        }
        
        const name = firstPart.substring(0, equalIndex).trim();
        const value = firstPart.substring(equalIndex + 1).trim();
        
        if (!name || !value) {
          console.warn('⚠️ [IPC] 쿠키 파싱 실패 (이름/값 없음):', cookieString);
          continue;
        }
        
        // 여러 URL 형식으로 쿠키 저장 시도
        const cookieUrls = [
          baseUrl,  // http://host:port
          `${urlObj.protocol}//${urlObj.hostname}`,  // http://host (포트 제외)
          `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || ''}`,  // 포트 포함
        ];

        let saved = false;
        
        for (const cookieUrl of cookieUrls) {
          try {
            const cookieObj = {
              url: cookieUrl,
              name: name,
              value: value,
              path: '/',
              secure: false,
              httpOnly: true,
              sameSite: 'unspecified',
            };

            // 쿠키 설정 정보 파싱
            for (let i = 1; i < cookieParts.length; i++) {
              const part = cookieParts[i].toLowerCase();
              if (part.startsWith('path=')) {
                cookieObj.path = cookieParts[i].substring(5).trim();
              } else if (part === 'httponly') {
                cookieObj.httpOnly = true;
              } else if (part === 'secure') {
                cookieObj.secure = true;
              }
            }

            await session.defaultSession.cookies.set(cookieObj);
            
            // 저장 확인 (약간의 지연)
            await new Promise(resolve => setTimeout(resolve, 100));
            
            try {
              const verifyCookies = await session.defaultSession.cookies.get({ url: cookieUrl });
              if (verifyCookies.some(c => c.name === name && c.value === value)) {
                saved = true;
                break;
              }
            } catch (verifyErr) {
              // 저장 확인 실패 시 다음 URL 시도
            }
          } catch (setErr) {
            // 쿠키 저장 실패 시 다음 URL 시도
          }
        }
        
        if (!saved) {
          console.error(`❌ [IPC] 쿠키 저장 실패: ${name}`);
        }
      } catch (cookieErr) {
        console.error('❌ [IPC] 쿠키 저장 실패:', cookieErr);
      }
    }
    
    // 최종 확인
    const finalCookies = await session.defaultSession.cookies.get({});
    const savedCount = finalCookies.filter(c => c.name === 'JSESSIONID').length;
    
    if (savedCount > 0) {
      return { success: true, savedCount };
    } else {
      return { success: false, error: '쿠키가 저장되지 않았습니다' };
    }
  } catch (err) {
    console.error('❌ [IPC] 쿠키 저장 실패:', err);
    return { success: false, error: err.message };
  }
});

// 전체 쿠키 가져오기 IPC (디버깅용)
ipcMain.handle('get-all-cookies', async () => {
  try {
    const allCookies = await session.defaultSession.cookies.get({});
    return allCookies;
  } catch (err) {
    console.error('❌ [IPC] 전체 쿠키 가져오기 실패:', err);
    return [];
  }
});

// 쿠키 가져오기 IPC
ipcMain.handle('get-cookies', async (event, url) => {
  try {
    // 여러 URL 형식으로 시도
    const urlVariants = [url];
    
    try {
      const urlObj = new URL(url);
      urlVariants.push(
        `${urlObj.protocol}//${urlObj.host}`,  // http://host:port
        `${urlObj.protocol}//${urlObj.hostname}`,  // http://host (포트 제외)
        `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port || ''}`  // 포트 포함
      );
    } catch (e) {
      // URL 파싱 실패 시 원본 URL만 사용
    }
    
    let cookies = [];
    
    // 각 URL 형식으로 시도
    for (const urlVariant of urlVariants) {
      try {
        const foundCookies = await session.defaultSession.cookies.get({ url: urlVariant });
        if (foundCookies.length > 0) {
          cookies = foundCookies;
          break;
        }
      } catch (e) {
        // 해당 URL 형식으로 조회 실패 시 다음 시도
      }
    }
    
    // 여전히 없으면 모든 쿠키에서 JSESSIONID만 필터링
    if (cookies.length === 0) {
      try {
        const allCookies = await session.defaultSession.cookies.get({});
        const jsessionCookies = allCookies.filter(c => c.name === 'JSESSIONID');
        if (jsessionCookies.length > 0) {
          cookies = jsessionCookies;
          
          // URL과 일치하는 쿠키 우선 선택
          try {
            const urlObj = new URL(url);
            const host = urlObj.host;
            const hostname = urlObj.hostname;
            
            const matchedCookies = jsessionCookies.filter(c => {
              if (!c.domain && !c.url) return true;
              if (c.domain && (host.includes(c.domain) || hostname.includes(c.domain))) return true;
              if (c.url && (c.url.includes(host) || c.url.includes(hostname))) return true;
              return false;
            });
            
            if (matchedCookies.length > 0) {
              cookies = matchedCookies;
            }
          } catch (e) {
            // URL 파싱 실패 시 무시
          }
        }
      } catch (e) {
        // 전체 쿠키 조회 실패
      }
    }
    
    // 쿠키 객체 직렬화 (IPC 전달을 위해)
    return cookies.map(c => ({
      name: c.name,
      value: c.value,
      url: c.url || '',
      domain: c.domain || '',
      path: c.path || '/'
    }));
  } catch (err) {
    console.error('❌ [IPC] 쿠키 가져오기 실패:', err);
    return [];
  }
});


// 종료 처리

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
