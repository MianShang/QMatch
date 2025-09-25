import React, { useState, useEffect, createContext, useMemo } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';

{/* 컴포넌트 import */}
import LobbyPage from './route/lobbyPage/lobbyPage.jsx';
import SearchPage from './route/searchPage/searchPage.jsx';
import LoginPage from './route/loginPage/loginPage.jsx';
import SignUpRoutePage from './route/loginPage/loginPageRoute/signupRoutePage.jsx';
import AdminPage from './feature/admin/adminPage.jsx';



// 로그인 체크용 Context API 생성
export const LogContext = createContext();

function App() {
  const BASE_URL = import.meta.env?.VITE_API_URL || 'http://localhost:8080';
  const navigate = useNavigate();
  
  // 로딩 State
  const [isLoading, setIsLoading] = useState(true);
  // 전역 로그인 여부 State
  const [isLogIn, setIsLogIn] = useState(false);
  // 전역 유저 데이터 State
  const [userData, setUserData] = useState(null);
  const [friends,setFriends] = useState([]);
  const [statusByUser, setStatusByUser] = useState([]);
  const [friendInventoryUpdate, setFriendInventoryUpdate] = useState(null);

  // 안 읽은 메시지 상태
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  // 테마 상태
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    return savedTheme || 'dark';
  });

  // 테마 변경 함수 - 4개 테마 순환
  const toggleTheme = () => {
    const themes = ['dark', 'light', 'pink', 'blue'];
    const currentIndex = themes.indexOf(theme);
    const newTheme = themes[(currentIndex + 1) % themes.length];
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // 테마 적용
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
          console.log("서버에서 받은 실제 유저 데이터:", userDataResponse.data);
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
    },  10 * 60 * 6000); // 10분마다 반복

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
    isLoading,
    friends,
    statusByUser,

    friendInventoryUpdate, 
    setFriendInventoryUpdate,
    
    hasUnreadMessages,
    setHasUnreadMessages,
    theme,
    toggleTheme
  }), [isLogIn, userData, isLoading, friends, statusByUser,friendInventoryUpdate, setFriendInventoryUpdate, hasUnreadMessages, theme]);

  //친구 목록 가져오기
    useEffect(() => {
        if (!userData?.userId) return;
        const fetchFriends = async () => {
            try {
                const response = await axios.get(`/api/friends/list?userId=${userData.userId}`);
                setFriends(response.data);
            } catch (error) {
                console.error("친구 목록 불러오기 실패:", error);
            }
        };
        fetchFriends();
    }, [userData?.userId]);

  //전역 Stomp
  useEffect(() => {
    if (!userData?.userId) return;

    const stomp = new Client({
      webSocketFactory: () => new SockJS(`${BASE_URL}/gs-guide-websocket`),
      reconnectDelay: 5000,
      connectHeaders: { userId: userData.userId }
    });

    stomp.onConnect = () => {

      //친구 요청구독
      stomp.subscribe(`/topic/friends/${userData.userId}`, (frame) => {
      try {
            const payload = JSON.parse(frame.body);
              toast.info(payload.message || "새로운 친구 요청이 도착했습니다.");
            } catch (e) {
                console.error("친구추가 요청 에러", e);
            }
      });
    
        //친구 상태구독
      stomp.subscribe(`/topic/friends/status`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            setStatusByUser(prev => ({ ...prev, [payload.userId]: payload.status }));
          }
           catch (e) {
              console.error("친구상태 업데이트 에러", e);
          }
      });

      // 채팅방 입장 응답 구독
      stomp.subscribe(`/topic/user/${userData.userId}/join-response`, (message) => {
        try {
          const data = JSON.parse(message.body);
          
          if (data.type === 'join-approved') {
            toast.success(data.message);
            
            // 승인된 멤버가 자동으로 채팅방에 입장하도록 처리
            if (data.roomId) {
              console.log('승인 알림 수신 - 채팅방으로 이동:', data);
              
              // 채팅방으로 이동
              navigate('/', { 
                state: { 
                  type: 'multi', // 다대다 채팅방 타입 추가
                  roomId: data.roomId,
                  chatName: data.roomName,
                  gameName: data.gameName,
                  tagNames: data.tagNames || [],
                  joinType: 'approval', // 승인된 방
                  alreadyJoined: true // 이미 가입된 상태임을 표시
                }
              });
            }
          } else if (data.type === 'join-rejected') {
            toast.error(data.message);
          }
        } catch (e) {
          console.error("채팅방 입장 응답 에러", e);
        }
      });

      //친구 요청/차단 목록 업데이트
      stomp.subscribe(`/topic/friends/inventory/${userData.userId}`, (frame) => {
          try {
            const payload = JSON.parse(frame.body);
            setFriendInventoryUpdate(payload);

            axios.get(`/api/friends/list?userId=${userData.userId}`)
         .then(res => setFriends(res.data))
         .catch(err => console.error("친구 목록 갱신 실패:", err));
          }
           catch (e) {
              console.error("친구요청/차단 목록 업데이트 에러", e);
          }
      });
    };

    stomp.activate();

        return ()=>
          {
            stomp.deactivate();
          };

      }, [userData?.userId]
  );

    
  // 렌더링 숨기고 로딩창 표시 
  if (isLoading) {
    return (
      <div className="discord-loading">
        <h1>QMatch</h1>
        <div className="loading-spinner"></div>
      </div>
    );
  }
  console.log("권한 확인 직전 userData:", userData);

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
          <Route 
            path="/admin"
            // 3. 로그인 상태이고, 유저 역할이 'ADMIN'일 때만 페이지를 보여줍니다.
            element={
              isLogIn && userData?.authorities?.some(auth => auth.authority === 'ROLE_ADMIN')
              ? <AdminPage />
              : <Navigate to="/" replace />
            }
          />
          <Route path="/lobby" element={<LobbyPage />} />
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

