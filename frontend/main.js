const { app, BrowserWindow, session, protocol, ipcMain } = require('electron');
const path = require('path');
const psList = require('ps-list').default;

// 세션 쿠키 SameSite 설정
function configureSession() {
  const filter = { urls: ["http://*/*", "https://*/*"] };

  session.defaultSession.webRequest.onHeadersReceived(filter, (details, callback) => {
    const cookies = (details.responseHeaders['set-cookie'] || []).map(cookie =>
      cookie.replace('SameSite=Lax', 'SameSite=None; Secure')
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
    if (url === 'index.html') {
      //index.html 명시적 경로 지정
      callback({ path: path.join(__dirname, 'web-build', 'index.html') });
    } else {
      callback({ path: path.join(__dirname, 'web-build', url) });
    }
  });

  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
