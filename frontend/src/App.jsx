import React, { useState, useEffect, createContext, useMemo } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import axios from 'axios';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

{/* 컴포넌트 import */}
import LobbyPage from './route/lobbyPage/lobbyPage.jsx';
import SearchPage from './route/searchPage/searchPage.jsx';
import LoginPage from './route/loginPage/loginPage.jsx';
import SignUpRoutePage from './route/loginPage/loginPageRoute/signupRoutePage.jsx';

// 로그인 체크용 Context API 생성
export const LogContext = createContext();

function App() {
  
  // 로딩 State
  const [isLoading, setIsLoading] = useState(true);
  // 전역 로그인 여부 State
  const [isLogIn, setIsLogIn] = useState(false);
  // 전역 유저 데이터 State
  const [userData, setUserData] = useState(null);

  // 새로고침 or 첫 로딩시 자동 실행
  useEffect(() => {
    // 앱이 처음 마운트 될 때 실행되는 초기 값 (메모리 누수 방지용)
    let isMounted = true;

    const checkLoginStatus = async () => {
      try {
        // 세션 유효성 검사 API
        await axios.get('/api/check-login', { withCredentials: true });
        
        // 세션이 유효할 시 유저 정보를 가져온다
        const userDataResponse = await axios.get('/api/user/get-data', { withCredentials: true });
        
        if (isMounted) {
          // 전역으로 관리할 유저 데이터 State Set
          setUserData(userDataResponse.data);
          // 로그인 체크용 State TRUE
          setIsLogIn(true);
        }
      } catch (error) {
        // 세션이 유효하지 않으면 로그아웃 상태로 처리
        if (isMounted) {
          // 로그인 체크용 State FALSE
          setIsLogIn(false);
          setUserData(null);
        }
      } finally {
        // 모든 인증 과정이 끝나면 로딩 상태를 false로 변경
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    checkLoginStatus();

    // 10분마다 반복 실행, 유저 데이터 Set 을 제외하면 로직은 위 코드와 동일하다
    // 서버에 세션은 사라졌지만 웹 조작을 통한 악성유저 방지
    const interval = setInterval(() => {
        if (isMounted && isLogIn) { 
          axios.get('/api/check-login', { withCredentials: true })
            .catch(() => {
              // 세션 만료 시 자동으로 로그아웃 처리
              if (isMounted) {
                  setIsLogIn(false);
                  setUserData(null);
              }
            });
        }
    }, 10 * 60 * 1000); // 10분마다 반복

    // 언마운트 시 반복 중지
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [isLogIn]); // isLogIn 상태가 바뀔 때마다 인터벌 로직을 재평가

  // context 값 
  const contextValue = useMemo(() => ({
    isLogIn,
    setIsLogIn,
    userData,
    setUserData,
    isLoading
  }), [isLogIn, userData, isLoading]);

  // 렌더링 숨기고 로딩창 표시 
  if (isLoading) {
    return (
      <div className="discord-loading">
        <h1>QMatch</h1>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  // 로딩이 끝나면 실제 앱 화면을 렌더링
  return (
    <div className='fullscreen'>
      {/* 로그인 여부, 유저 데이터 State 전역 관리 */}
      <LogContext.Provider value={contextValue}>
        <Routes>
          {/* 초기 url 진입점인 "/" 비로그인시 "/login"로 자동연계 되게 할 예정*/}
          <Route 
            path="/" 
            // 로그인 되어 있으면 로비 페이지로(/), 아니면 로그인 페이지로(/login) 이동
            element={isLogIn ? <LobbyPage /> : <Navigate to="/login" replace />} 
          />
          <Route path="/search" element={<SearchPage />} />
          <Route 
            path="/login" 
            // 로그인 안되어 있으면 로그인 페이지로, 되어있으면 로비 페이지로 이동
            element={!isLogIn ? <LoginPage /> : <Navigate to="/" replace />} 
          />
          <Route path="/signup" element={<SignUpRoutePage />} />
        </Routes>
      </LogContext.Provider>
      <ToastContainer
        position="top-right"
        autoClose={1000}   // 3초 뒤 자동 닫힘
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"      // 테마: "light", "dark", "colored"
      />
    </div>
  );
}

export default App;

