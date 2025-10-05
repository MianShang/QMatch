import React, { useState, useEffect, createContext, useMemo, useRef, use } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { ToastContainer, toast } from 'react-toastify';
import axios from 'axios';
import './App.css';
import 'react-toastify/dist/ReactToastify.css';
import { FaPhoneSlash, FaMicrophone, FaMicrophoneSlash } from 'react-icons/fa6';
import { getFriendUnReadChatCount } from './hooks/chatNotice/useFriendUnReadChatCount.js';

{/* 컴포넌트 import */}
import LobbyPage from './route/lobbyPage/lobbyPage.jsx';
import SearchPage from './route/searchPage/searchPage.jsx';
import LoginPage from './route/loginPage/loginPage.jsx';
import SignUpRoutePage from './route/loginPage/loginPageRoute/signupRoutePage.jsx';
import AdminPage from './feature/admin/adminPage.jsx';
import FriendInviteNotificationModal from './modal/FriendInviteNotificationModal/FriendInviteNotificationModal.jsx';
import VoiceChat from './route/lobbyPage/lobbyPageRoute/VoiceChat.jsx';

//전역 stomp
import { useGlobalStomp } from './hooks/stomp/useGlobalStomp.js';
import { useGameStatus } from './hooks/status/useGameStatus.js';

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
  const [friends, setFriends] = useState([]);
  const [statusByUser, setStatusByUser] = useState([]);
  const [friendInventoryUpdate, setFriendInventoryUpdate] = useState(null);
  const [selectedFriendRoom, setSelectedFriendRoom] = useState(null);
  //친구 메시지 안읽은 카운트
  const [friendUnreadCounts, setFriendUnreadCounts] = useState({});
  //친구 채팅 최신값 저장 Ref
  const selectedFriendRoomRef = useRef(null);
  // 실시간 프로세스 목록 담을 State
  const [processes, setProcesses] = useState([]);
  //전역 STOMP 훅
  const { subscribe, publish, isConnected } = useGlobalStomp(userData);

  // 프로세스 추척할 게임 목록
  const gameTarget = [
    { exe: "leagueclientux.exe", label: "리그오브레전드" },
    { exe: "maplestory.exe", label: "메이플스토리" },
    { exe: "lostark.exe", label: "로스트아크" },
    { exe: "dnf.exe", label:"던전앤파이터"}];

  //게임 실행여부 훅
  const { isRunning, gameStatusByUser } = useGameStatus(publish, subscribe, isConnected, userData, gameTarget, processes);

  // 안 읽은 메시지 상태
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false);
  const [hasUnReadFriendMessages, setHasUnReadFriendMessages] = useState(false);

  // 음성채널 참여자 목록
  const [voiceParticipants, setVoiceParticipants] = useState({});

  // 친구 초대 알림 상태
  const [friendInviteNotification, setFriendInviteNotification] = useState({
    open: false,
    data: null
  });

  // 음성채팅 관련 상태 관리
  const [activeVoiceChannel, setActiveVoiceChannel] = useState(null); // 현재 활성 음성채널
  const [voiceChatRoomId, setVoiceChatRoomId] = useState(null); // 음성채팅 룸 ID
  const [voiceSpeakers, setVoiceSpeakers] = useState({}); // 음성 참여자 목록
  const [localMuted, setLocalMuted] = useState(false); // 로컬 음소거 상태
  const [joinedVoice, setJoinedVoice] = useState(false); // 음성채팅 참여 여부
  const [currentVoiceRoomId, setCurrentVoiceRoomId] = useState(null); // 현재 음성채팅 룸 ID
  
  // 드래그 가능한 음성채팅 UI 위치 관리
  const [voiceChatPosition, setVoiceChatPosition] = useState({ x: 20, y: 20 }); // UI 위치 좌표
  const [isDragging, setIsDragging] = useState(false); // 드래그 중인지 여부
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // 드래그 시작점
  const [currentSelectedRoom, setCurrentSelectedRoom] = useState(null);
  const [friendVoiceChatActive, setFriendVoiceChatActive] = useState(false);
  const [currentFriendVoiceChat, setCurrentFriendVoiceChat] = useState(null); // 현재 친구 음성채팅 정보
  const [currentGroupVoiceChat, setCurrentGroupVoiceChat] = useState(null); // 현재 그룹 음성채팅 정보
  const voiceChatRef = useRef(null);

  // 음성채팅 UI 드래그 핸들러 함수들
  const handleMouseDown = (e) => {
    // 버튼 영역에서는 드래그 방지
    if (e.target.closest('.voice-chat-controls')) {
      return;
    }
    setIsDragging(true);
    const rect = e.currentTarget.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    });
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // 화면 경계 내에서만 이동 가능하도록 제한
    const maxX = window.innerWidth - 300;
    const maxY = window.innerHeight - 100;
    
    setVoiceChatPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // 드래그 중일 때 전역 마우스 이벤트 리스너 등록
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);

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


  // 1초마다 프로세스 목록 불러오는 Effect (Electron 환경에서만)
  useEffect(() => {
    // Electron 환경 체크
    const isElectron = window.require && window.require('electron');
    
    if (!isElectron) {
      return;
    }

    const fetchProcesses = async () => {
      try {
        const list = await window.require('electron').ipcRenderer.invoke('get-process-list');
        setProcesses(list);
      } catch (error) {
        console.error('프로세스 목록 가져오기 실패:', error);
      }
    };

    // 최초 1회 호출 및 10초마다 갱신
    fetchProcesses();
    const interval = setInterval(fetchProcesses, 10000);

    return () => clearInterval(interval); // 언마운트 시 clear
  }, []);

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
    isLoading,
    friends,
    statusByUser,
    friendInventoryUpdate,
    setFriendInventoryUpdate,
    hasUnreadMessages,
    setHasUnreadMessages,
    theme,
    toggleTheme,
    hasUnReadFriendMessages,
    setHasUnReadFriendMessages,
    friendUnreadCounts,
    setFriendUnreadCounts,
    selectedFriendRoom,
    setSelectedFriendRoom,
    isRunning,
    voiceParticipants,
    setVoiceParticipants,
    gameStatusByUser,
    friendInviteNotification,
    setFriendInviteNotification,

    activeVoiceChannel,
    setActiveVoiceChannel,
    voiceChatRoomId,
    setVoiceChatRoomId,
    voiceSpeakers,
    setVoiceSpeakers,
    localMuted,
    setLocalMuted,
    joinedVoice,
    setJoinedVoice,
    currentVoiceRoomId,
    setCurrentVoiceRoomId,
    currentSelectedRoom,
    setCurrentSelectedRoom,
    friendVoiceChatActive,
    setFriendVoiceChatActive,
    currentFriendVoiceChat,
    setCurrentFriendVoiceChat,
    currentGroupVoiceChat,
    setCurrentGroupVoiceChat,
    voiceChatRef
  }), [isLogIn, userData, isLoading, friends, statusByUser, friendInventoryUpdate, setFriendInventoryUpdate, hasUnreadMessages, theme, hasUnReadFriendMessages, setHasUnReadFriendMessages, friendUnreadCounts, setFriendUnreadCounts, selectedFriendRoom, setSelectedFriendRoom, isRunning, voiceParticipants, activeVoiceChannel, voiceChatRoomId, voiceSpeakers, localMuted, joinedVoice, currentVoiceRoomId, currentSelectedRoom, friendVoiceChatActive, currentFriendVoiceChat, currentGroupVoiceChat, gameStatusByUser, friendInviteNotification, setFriendInviteNotification]);

  //친구 최신값 저장 State가 바뀔때 마다 갱신
  useEffect(() => {
    selectedFriendRoomRef.current = selectedFriendRoom;
  }, [selectedFriendRoom]);

  //친구 목록 가져오기
  useEffect(() => {
    if (!userData?.userId) return;
    const fetchFriends = async () => {
      try {
        const response = await axios.get(`/api/friends/list?userId=${userData.userId}`);
        setFriends(response.data);

        const unreadCounts = {};
        let hasUnread = false;

        // 방별로 안읽은 메시지 개수 조회
        for (const friend of response.data) {
          try {
            const roomResponse = await axios.get(`/api/friends/chatroom/${friend.userId}/${userData.userId}`);
            const roomId = roomResponse.data.roomId;

            const countResponse = await axios.get(`/api/friends/chatroom/${roomId}/unread-count`, {
              params: { userId: userData.userId },
            });

            const count = countResponse.data || 0;
            unreadCounts[friend.userId] = count;
            if (count > 0) hasUnread = true;
          } catch (error) {
            console.error(`친구 ${friend.userId}의 안읽은 메시지 개수 조회 실패:`, error);
            unreadCounts[friend.userId] = 0;
          }
        }

        setFriendUnreadCounts(unreadCounts);
        setHasUnReadFriendMessages(hasUnread);
      } catch (error) {
        console.error("친구 목록 불러오기 실패:", error);
      }
    };
    fetchFriends();
  }, [userData?.userId]);

  //전역 Stomp 훅 사용
  useEffect(() => {
    if (!userData?.userId) return;

    //친구 요청구독
    subscribe(`/topic/friends/${userData.userId}`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        toast.info(payload.message || "새로운 친구 요청이 도착했습니다.");
      } catch (e) {
        console.error("친구추가 요청 에러", e);
      }
    });

    //친구 상태구독
    subscribe(`/topic/friends/status`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        setStatusByUser(prev => ({ ...prev, [payload.userId]: payload.status }));
      }
      catch (e) {
        console.error("친구상태 업데이트 에러", e);
      }
    });

    // 채팅방 입장 응답 구독
    subscribe(`/topic/user/${userData.userId}/join-response`, (message) => {
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

    //친구 요청/차단 목록 업데이트 (친구 관계 변경 시에만 전체 갱신)
    subscribe(`/topic/friends/inventory/${userData.userId}`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        setFriendInventoryUpdate(payload);

        // 친구 관계가 변경된 경우 또는 안읽은 메시지가 업데이트된 경우 전체 목록 갱신
        if (payload.bottomToggle === 'friends') {
          axios
            .get(`/api/friends/list?userId=${userData.userId}`)
            .then(async (res) => {
              setFriends(res.data);

              // 친구 목록이 변경되었으므로 안읽은 개수도 재조회
              const unreadCounts = {};
              let hasUnread = false;

              for (const friend of res.data) {
                try {
                  const roomResponse = await axios.get(
                    `/api/friends/chatroom/${friend.userId}/${userData.userId}`
                  );
                  const roomId = roomResponse.data.roomId;

                  const countResponse = await axios.get(
                    `/api/friends/chatroom/${roomId}/unread-count`,
                    {
                      params: { userId: userData.userId },
                    }
                  );

                  const count = countResponse.data || 0;
                  unreadCounts[friend.userId] = count;
                  if (count > 0) hasUnread = true;
                } catch (error) {
                  console.error(
                    `친구 ${friend.userId}의 안읽은 메시지 개수 조회 실패:`,
                    error
                  );
                  unreadCounts[friend.userId] = 0;
                }
              }

              setFriendUnreadCounts(unreadCounts);
              setHasUnReadFriendMessages(hasUnread);
            })
            .catch((err) => {
              console.error('친구 목록 갱신 실패:', err);
            });
        }
      } catch (e) {
        console.error('친구요청/차단 목록 업데이트 에러', e);
      }
    });

    // 개별 친구의 안읽은 메시지 개수 실시간 업데이트
    subscribe(`/topic/friends/unread/${userData.userId}`, (frame) => {
      try {
        const data = JSON.parse(frame.body);
        const { friendId, unreadCount } = data;

        // 항상 최신 selectedFriendRoom 확인
        const currentRoom = selectedFriendRoomRef.current;
        if (currentRoom?.friendId === friendId) {
          // 현재 열려 있는 방이면 카운트 무시
          return;
        }

        // 해당 친구의 안읽은 개수만 업데이트
        setFriendUnreadCounts(prev => {
          const updated = { ...prev, [friendId]: unreadCount };
          const hasUnread = Object.values(updated).some(count => count > 0);
          setHasUnReadFriendMessages(hasUnread);
          return updated;
        });
      } catch (e) {
        console.error("친구 안읽은 메시지 업데이트 에러", e);
      }
    });

    // 친구 초대 알림 구독
    subscribe(`/topic/user/${userData.userId}/friend-invite`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        console.log('친구 초대 알림 수신:', payload);
        
        setFriendInviteNotification({
          open: true,
          data: payload
        });
      } catch (e) {
        console.error("친구 초대 알림 에러", e);
      }
    });

    // 방장에게 친구 초대 응답 알림 구독
    subscribe(`/topic/user/${userData.userId}/friend-invite-response`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);

        if (payload.type === 'rejected') {
          toast.info(`${payload.friendName}님이 초대를 거절했습니다.`);
        }

      } catch (e) {
        console.error("친구 초대 응답 알림 에러", e);
      }
    });

  }, [userData?.userId, subscribe]);

  // 로그아웃 시 초대 수락 모달 숨기기
  useEffect(() => {
    if (!isLogIn) {
      setFriendInviteNotification({ open: false, data: null });
    }
  }, [isLogIn]);

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
      
      {/* 친구 초대 알림 모달 */}
      <FriendInviteNotificationModal
        open={friendInviteNotification.open}
        onClose={() => setFriendInviteNotification({ open: false, data: null })}
        inviteData={friendInviteNotification.data}
        onAccept={(inviteData) => {
          // 방 입장 처리
          navigate('/', {
            state: {
              type: 'multi',
              roomId: inviteData.roomId,
              chatName: inviteData.roomName,
              gameName: inviteData.gameName,
              tagNames: inviteData.tagNames || [],
              joinType: 'friend-invite',
              alreadyJoined: true
            }
          });
        }}
      />

      {/* VoiceChat 컴포넌트를 App.jsx에서 전역 렌더링 */}
      {isLogIn && userData && (
        <VoiceChat
          uid={userData.userId}
          onSpeakers={setVoiceSpeakers}
          onLocalMuteChange={setLocalMuted}
          onJoinChange={setJoinedVoice}
          onParticipantsChange={() => {}} 
          channelId={currentVoiceRoomId}
          roomId={currentSelectedRoom?.id} 
          globalStomp={globalStomp}
          onVoiceChatSwitch={(data) => {
            // 음성채팅 전환 시 전역 상태 업데이트
            if (data.type === 'join') {
              // 그룹 채팅방 음성채팅인 경우
              if (currentSelectedRoom && !data.channelId.startsWith('friend_')) {
                setCurrentGroupVoiceChat({
                  roomId: currentSelectedRoom.id,
                  roomName: currentSelectedRoom.name,
                  gameName: currentSelectedRoom.gameName,
                  tagNames: currentSelectedRoom.tagNames || [],
                  channelId: data.channelId
                });
                // 친구 음성채팅 상태 초기화
                setFriendVoiceChatActive(false);
                setCurrentFriendVoiceChat(null);
              }
            } else if (data.type === 'leave') {
              // 음성채팅 퇴장 시 모든 상태 초기화
              setCurrentGroupVoiceChat(null);
              setFriendVoiceChatActive(false);
              setCurrentFriendVoiceChat(null);
            }
          }}
          ref={voiceChatRef}
        />
      )}
      
      {/* 전역 음성채팅 상태 표시 UI - 친구 및 그룹 채팅 지원 */}
      {((friendVoiceChatActive && currentFriendVoiceChat) || (joinedVoice && currentGroupVoiceChat)) && (
        <div 
          className={`global-voice-chat-indicator ${isDragging ? 'dragging' : ''}`}
          style={{
            position: 'fixed',
            left: `${voiceChatPosition.x}px`,
            top: `${voiceChatPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
          onClick={(e) => {
            if (isDragging) {
              e.preventDefault();
              return;
            }
            // 클릭 시 해당 채팅방으로 이동
            if (friendVoiceChatActive && currentFriendVoiceChat) {
              // 1대1 친구 채팅방으로 이동
              setSelectedFriendRoom({
                friendId: currentFriendVoiceChat.friendId,
                roomId: currentFriendVoiceChat.roomId
              });
            } else if (currentGroupVoiceChat) {
              // 그룹 채팅방으로 이동
              navigate('/', { 
                state: { 
                  type: 'multi',
                  roomId: currentGroupVoiceChat.roomId,
                  chatName: currentGroupVoiceChat.roomName,
                  gameName: currentGroupVoiceChat.gameName,
                  tagNames: currentGroupVoiceChat.tagNames || []
                }
              });
            }
          }}
          title="채팅방으로 이동"
        >
          {/* 음성채팅 정보 표시 영역 */}
          <div className="voice-chat-info">
            <span className="voice-chat-text">
              {friendVoiceChatActive && currentFriendVoiceChat 
                ? `${currentFriendVoiceChat.friendName}님과 통화 중`
                : currentGroupVoiceChat 
                  ? `${currentGroupVoiceChat.roomName} 방에서 통화 중`
                  : '통화 중'
              }
            </span>
          </div>
          {/* 음성채팅 컨트롤 버튼 영역 */}
          <div className="voice-chat-controls">
            {/* 음소거/음소거 해제 버튼 */}
            <button 
              className={`voice-chat-mute-btn ${localMuted ? 'muted' : ''}`}
              onClick={(e) => {
                e.stopPropagation();
                if (voiceChatRef.current) {
                  voiceChatRef.current.toggleMute();
                }
              }}
              title={localMuted ? "음소거 해제" : "음소거"}
            >
              {localMuted ? <FaMicrophoneSlash className="voice-chat-icon" /> : <FaMicrophone className="voice-chat-icon" />}
            </button>
            {/* 통화 종료 버튼 */}
            <button 
              className="voice-chat-end-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (voiceChatRef.current) {
                  voiceChatRef.current.leaveChannel();
                }
                // 음성채팅 상태 초기화
                setFriendVoiceChatActive(false);
                setCurrentFriendVoiceChat(null);
                setCurrentGroupVoiceChat(null);
                setJoinedVoice(false);
                setCurrentVoiceRoomId(null);
                setVoiceChatRoomId(null);
              }}
              title="통화 종료"
            >
              <FaPhoneSlash className="voice-chat-icon" />
            </button>
          </div>
        </div>
      )}
      
      <ToastContainer
        position="top-right"
        autoClose={1000}   // 3초 뒤 자동 닫힘
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        closeButton={false}  // X 표시 제거
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

