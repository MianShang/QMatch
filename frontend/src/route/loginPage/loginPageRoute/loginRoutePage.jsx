import { useState, useEffect, useContext } from 'react'
import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import axios from '@axios';
import './routePage.css'

// 로그인 체크용 Context import
import { LogContext } from '../../../App.jsx'



function LogInRoutePage() {
  // navigate 객체 생성
  const navigate = useNavigate();

  // State 보관함 해체
  let {isLogIn, setIsLogIn, setUserData}  = useContext(LogContext);

  console.log(isLogIn)

  //자동로그인 체크박스 
  const [rememberMe, setRememberMe] = useState(false);

  // ID, PW 받을 State
  const [credentials, setCredentials] = useState({
    username: '',
    password: ''
  });

  // State 자동 입력
  function handleChange(e) {
    const { name, value } = e.target;

    setCredentials(function (prev) {
      return {...prev, [name]: value};
    });
  }
    
  // 로그인 처리 함수
  function handleSubmit(e) {
    e.preventDefault();

    // HTML 폼 형식으로 데이터 보내기 위함
    const params = new URLSearchParams();

    params.append('username', credentials.username);
    params.append('password', credentials.password);

    //자동 로그인이 체크 되어있을 경우 파라미터를 추가 
    if (rememberMe) {
      params.append('remember-me', 'true');
    }
  

    // HTML 폼 형식 (x-www-form-urlencoded)
    // username=입력한아이디&password=입력한비밀번호 이런식으로 드감
    axios.post('/api/loginProc', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'X-Requested-With': 'XMLHttpRequest'},
      withCredentials: true
    })
    .then(async (res) => {
      // Electron 환경에서 JSESSIONID를 받아서 쿠키로 저장
      if (window?.require && typeof window.require === 'function') {
        try {
          const { ipcRenderer } = window.require('electron');
          
          // 응답에서 sessionId 추출
          let sessionId = null;
          try {
            const responseData = typeof res.data === 'string' ? JSON.parse(res.data) : res.data;
            sessionId = responseData?.sessionId;
          } catch (e) {
            // JSON 파싱 실패 시 무시
          }
          
          if (sessionId) {
            // Electron 세션에 쿠키 저장
            const BASE_URL = import.meta.env.VITE_API_URL;
            const baseUrl = BASE_URL.includes('://') 
              ? BASE_URL.split('/').slice(0, 3).join('/')
              : BASE_URL;
            
            const cookieString = `JSESSIONID=${sessionId}; Path=/; HttpOnly`;
            const result = await ipcRenderer.invoke('set-cookies', baseUrl, [cookieString]);
            
            if (!result.success) {
              console.error('[Login] JSESSIONID 쿠키 저장 실패:', result.error);
            }
            
            // 저장 완료 대기
            await new Promise(r => setTimeout(r, 200));
          }
        } catch (err) {
          console.error('[Login] Electron IPC 실패:', err);
        }
      }

      // 약간의 지연 후 유저 정보 가져오기 (쿠키 저장 완료 대기)
      await new Promise(r => setTimeout(r, 500));

      // 로그인 성공시 유저 정보를 전역 유저 데이터 State Set
        const userRes = await axios.get('/api/user/get-data', { withCredentials: true });
        console.log(userRes.data);
        const { userId, userName, userEmail } = userRes.data;
          // 전역으로 관리할 유저 데이터 State Set
        setUserData({ userId, userName, userEmail }); 

      // 로그인 여부 Context API TRUE
      setIsLogIn(true);

      toast.success("로그인 성공!");

      // 로그인 성공시 로비 컴포넌트로('/')
      navigate('/');
    })
    .catch((err) => {

      toast.error("로그인 실패");

      console.error(err);
    });
  }


  return (
    <div className="LogRoutePageStyle fullscreen">

      <form className="login-form" onSubmit={handleSubmit}>

        <input type="text" name="username" placeholder='ID' required
            value={credentials.username} onChange={handleChange} />

        <input type="password" name="password" placeholder='PW' required
            value={credentials.password} onChange={handleChange} />

        <div className="remember-me-container">

          <input 
                    type="checkbox" 
                    id="remember-me" 
                    name="remember-me"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                />
                    <label htmlFor="remember-me">자동 로그인</label>
                </div>

        <button type="submit">로그인</button>
      </form>
    </div>
  );
}
export default LogInRoutePage
