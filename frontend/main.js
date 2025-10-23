const { app, BrowserWindow, session, protocol, ipcMain } = require('electron');
const path = require('path');
const psList = require('ps-list').default;

// 세션 쿠키 SameSite 설정
function configureSession() {
  const filter = { urls: ["http://*/*", "https://*/*"] };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const cookies = (details.responseHeaders['set-cookie'] || []).map(cookie =>
      cookie
        .replace(/SameSite=Lax/gi, 'SameSite=None')
        .replace(/SameSite=Strict/gi, 'SameSite=None')
    );
    if (cookies.length > 0) {
      details.responseHeaders['set-cookie'] = cookies;
    }
    callback({ cancel: false, responseHeaders: details.responseHeaders });
  });
}

// 윈도우 생성 함수
function createWindow() {
  configureSession();

  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 1200,
    minHeight: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      webSecurity: false,
      allowRunningInsecureContent: true,
    },
    icon: path.join(__dirname, 'assets', 'qmatchLogo.png'),
  });

  win.setMenu(null);

  // 배포/개발 환경 구분
  const startURL = app.isPackaged
    ? 'app://index.html'
    : 'http://localhost:5173';

  win.loadURL(startURL);

  console.log('🚀 로드 대상 URL:', startURL);

  if (!app.isPackaged) win.webContents.openDevTools();
}

// 프로세스 목록 (ps-list)
ipcMain.handle('get-process-list', async () => {
  try {
    const processes = await psList();
    return processes;
  } catch (err) {
    console.error('프로세스 목록 가져오기 실패:', err);
    throw err;
  }
});

//app.whenReady() 안에서 프로토콜 등록
app.whenReady().then(() => {
  //프로토콜은 반드시 앱 준비 후 등록
  protocol.registerFileProtocol('app', (request, callback) => {
    let url = request.url.replace('app://', '');
    const buildPath = path.join(__dirname, 'frontend', 'web-build');

    try {
      if (!url || url === 'index.html') {
        const target = path.join(buildPath, 'index.html');
        console.log('📦 Electron index.html 경로:', target);
        callback({ path: target });
      } else {
        const target = path.join(buildPath, url);
        console.log('📦 Electron 요청 파일:', target);
        callback({ path: target });
      }
    } catch (err) {
      console.error('❌ 파일 로드 실패:', err);
    }
  });

  createWindow();
});



app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
