import axios from 'axios';

// -----------------------------------------------------
// 1️ 환경 감지
// -----------------------------------------------------
const isDev = import.meta.env.DEV; // vite dev 여부
const isElectron = !!window?.electron; // electron 여부

// -----------------------------------------------------
// 2️ 기본 URL 결정
// -----------------------------------------------------
let BASE_URL = '';

if (isDev) {
  // Vite 개발 서버 실행 중일 때 (npm run dev)
  BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
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
  headers: {
    'Content-Type': 'application/json'
  },
});

// -----------------------------------------------------
// 4️ Electron 환경에서 쿠키 수동 주입 (빌드 시)
// -----------------------------------------------------
// if (isElectron && !isDev) {
//   // Electron 쿠키를 axios 요청 헤더에 자동 추가
//   (async () => {
//     try {
//       const cookies = await window.electron.cookies.get({ url: BASE_URL });
//       const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');
//       globalAxios.defaults.headers.Cookie = cookieHeader;
//       console.log('[Electron] 쿠키 헤더 주입 완료:', cookieHeader);
//     } catch (err) {
//       console.error('[Electron] 쿠키 불러오기 실패:', err);
//     }
//   })();
// }

// -----------------------------------------------------
// 5️ 요청/응답 인터셉터
// -----------------------------------------------------
globalAxios.interceptors.request.use(
  (config) => {
    if (isDev) {
      console.log(`[Axios Request] ${config.method?.toUpperCase()} ${config.url}`);
    }
    return config;
  },
  (error) => {
    console.error('[Axios Request Error]', error);
    return Promise.reject(error);
  }
);

globalAxios.interceptors.response.use(
  (response) => {
    if (isDev) {
      console.log(`[Axios Response]`, response.status, response.config.url);
    }
    return response;
  },
  (error) => {
    console.error('[Axios Error]', error);
    if (error.response) {
      const { status, config } = error.response;
      console.error(`❌ HTTP ${status} @ ${config.url}`);
    } else {
      console.error('❌ Network or CORS error:', error.message);
    }
    return Promise.reject(error);
  }
);

export default globalAxios;
