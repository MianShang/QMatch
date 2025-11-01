import axios from 'axios';

// -----------------------------------------------------
// 1️ 환경 감지
// -----------------------------------------------------
const isDev = import.meta.env.DEV; // vite dev 여부

// Electron 환경 감지 (안전하게 처리)
let isElectron = false;
try {
  isElectron = !!(window?.require && window.require('electron'));
} catch (e) {
  // Electron이 아닌 환경
  isElectron = false;
}

// -----------------------------------------------------
// 2️ 기본 URL 결정
// -----------------------------------------------------
let BASE_URL = '';

if (isDev) {
  // Vite 개발 서버 실행 중일 때 (npm run dev)
  BASE_URL = import.meta.env.VITE_API_URL;
} else {
  // 배포된 Electron exe일 때
  // 실제 백엔드 서버 주소로 고정
  BASE_URL = import.meta.env.VITE_API_URL;
}

// -----------------------------------------------------
// 3️ Axios 인스턴스 생성
// -----------------------------------------------------
const globalAxios = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // 세션 쿠키 전송 허용
  timeout: 10000,
});

// -----------------------------------------------------
// 4️ Electron 환경에서 쿠키 수동 주입 함수
// -----------------------------------------------------
async function injectElectronCookies(config) {
  // Electron 환경이고 배포된 경우에만 실행
  if (isElectron && !isDev) {
    try {
      // IPC를 통해 쿠키 가져오기
      const { ipcRenderer } = window.require('electron');
      
      // BASE_URL을 정규화 (프로토콜 + 호스트 + 포트만)
      let cookieUrl = BASE_URL;
      if (cookieUrl.includes('://')) {
        try {
          const urlObj = new URL(cookieUrl);
          cookieUrl = `${urlObj.protocol}//${urlObj.host}`; // 포트 포함
        } catch (e) {
          // URL 파싱 실패 시 그대로 사용
        }
      }
      
      const cookies = await ipcRenderer.invoke('get-cookies', cookieUrl);
      
      // Electron 환경에서는 webRequest.onBeforeSendHeaders에서 쿠키를 주입하므로
      // 여기서는 withCredentials만 설정
      // 브라우저에서는 Cookie 헤더를 직접 설정할 수 없음 (보안 정책)
      if (cookies && Array.isArray(cookies) && cookies.length > 0) {
        config.withCredentials = true;
      }
    } catch (err) {
      console.error('[Electron] 쿠키 불러오기 실패:', err);
      // 에러가 발생해도 요청은 계속 진행
    }
  }
  return config;
}

// -----------------------------------------------------
// 5️ 요청/응답 인터셉터
// -----------------------------------------------------
globalAxios.interceptors.request.use(
  async (config) => {
    // Electron 환경에서 매 요청마다 쿠키 동적 주입
    await injectElectronCookies(config);
    
    // 요청 정보 로그 (에러 발생 시만 상세 로그)
    
    return config;
  },
  (error) => Promise.reject(error)
);

globalAxios.interceptors.response.use(
  async (response) => {
    // 응답 정보 로그 (에러 발생 시만 상세 로그)
    
    // Electron 환경에서 로그인 응답 후 쿠키를 강제로 확인하고 저장
    if (isElectron && !isDev && response.status === 200 && response.config.url?.includes('/api/loginProc')) {
      try {
        const { ipcRenderer } = window.require('electron');
        
        // 요청 URL 구성
        let requestUrl = BASE_URL;
        if (response.config.url) {
          if (response.config.url.startsWith('http')) {
            requestUrl = response.config.url;
          } else {
            requestUrl = response.config.url.startsWith('/') 
              ? `${BASE_URL}${response.config.url}`
              : `${BASE_URL}/${response.config.url}`;
          }
        }
        
        // 로그인 후 쿠키 확인 (디버깅용)
        setTimeout(async () => {
          try {
            const urlObj = new URL(requestUrl);
            const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
            const cookies = await ipcRenderer.invoke('get-cookies', baseUrl);
            
            if (cookies.length === 0) {
              console.warn('[Axios] 로그인 후 쿠키가 없습니다.');
            }
          } catch (err) {
            console.error('[Axios] 쿠키 확인 실패:', err);
          }
        }, 500);
      } catch (err) {
        console.error('[Axios] Electron IPC 접근 실패:', err);
      }
    }
    
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(`❌ HTTP ${error.response.status} @ ${error.response.config.url}`);
      
      // 401 에러인 경우 쿠키 정보도 출력
      if (error.response.status === 401) {
        console.error('❌ [401] 인증 실패 - 요청 헤더:', error.response.config.headers);
        console.error('❌ [401] 요청에 포함된 Cookie:', error.response.config.headers?.Cookie || '없음');
      }
    } else {
      console.error('❌ Network or CORS error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default globalAxios;
