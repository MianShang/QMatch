import { useRef, useState, useEffect, useContext, memo, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from '@axios';
import AgoraRTC from 'agora-rtc-sdk-ng';
import './lobbyPage.css'
import { FaPhone } from 'react-icons/fa6';

// 컴포넌트 import
import ChatListPage from './lobbyPageRoute/chatListPage.jsx';
import FriendListPage from './lobbyPageRoute/friendListPage.jsx';
import MyProfile from '../../feature/profile/myProfileModal.jsx';
import VoiceChatModal from '../../modal/VoiceChatSettingsModal/VoiceChatSettingsModal.jsx';
import ChatRoom from './ChatRoom.jsx';

import UserHistoryModal from '../../modal/userHistory/UserHistoryModal.jsx';
// JoinRequestModal 제거 - 기존 UI에 통합

//리액트 아이콘
import { MdOutlineConstruction } from "react-icons/md";
import { IoSearch } from "react-icons/io5";

// 로그인 체크용 Context API import
import { LogContext } from '../../App.jsx'

// Custom hook import
import { useChatSubscriber } from '../../hooks/chat/useChatSubscriber.js'
import { useFriendChatSubscriber } from '../../hooks/chat/useFriendChatSubscriber.js';
import { useChatSender } from '../../hooks/chat/useChatSender.js'
import { useLoginCheck } from '../../hooks/login/useLoginCheck.js';
import { useLogout } from '../../hooks/login/useLogout.js';
import { useLocation } from 'react-router-dom';
import { useGlobalStomp } from '../../hooks/stomp/useGlobalStomp.js';
import { useChatListGet } from '../../hooks/chatList/useChatListGet.js';
import { useSetReadUnReadChat } from '../../hooks/chatNotice/useSetReadUnReadChat.js';
import { useFriendChatListGet } from '../../hooks/chatList/useFriendChatListGet.js';
import { useFriendChatSender } from '../../hooks/chat/useFriendChatSender.js';
import { useFriendReadChat } from '../../hooks/chatNotice/useFriendReadChat.js';

// 상태 체크 훅 import 추가
import useUserStatusReporter from '../../hooks/status/useUserStatusReporter.js';

function LobbyPage() {

  // 사이드바 프로필 이미지 클릭시 내 프로필 상세 정보를 보여주는 모달창을 띄어줌
  const [showProfileModal, setShowProfileModal] = useState(false);
  // 프로필 유저 구분
  const [profileUserId, setProfileUserId] = useState(null);

  // 상태 패널 열림 여부
  const [isStatusPanelOpen, setIsStatusPanelOpen] = useState(false);

  // 사용자 전적 모달 상태
  const [isUserHistoryOpen, setIsUserHistoryOpen] = useState(false);
  const [historyUserId, setHistoryUserId] = useState(null);
  const [sendToModalGameName, setSendToModalGameName] = useState('');

  

  // 사이드바 프로필 이미지 클릭시 중앙 div는 사라지게 - 기본값 true(중앙 div 표시)
  const [showMidBar, setShowMidBar] = useState(true);

  // toggle State를 기준으로 채팅 / 친구 컴포넌트 교체 - 기본값 true (채팅)
  const [toggle, setToggle] = useState(true);

  // 토글 상태 변경 시 참여자 패널 자동 닫기
  const handleToggleChange = (newToggle) => {
    setToggle(newToggle);
    if (!newToggle) {
      // 친구 토글로 변경 시 참여자 패널 닫기
      setIsMembersPanelOpen(false);
    }
  };

  const [selectedRoom, setSelectedRoom] = useState();      // 실시간 참여한 채팅방 데이터를 담은 State
  const [messages, setMessages] = useState([]);      // 보낼 메세지
  const [client, setClient] = useState(null);      // client 연결 여부 State
  const [input, setInput] = useState('');      // input 입력 Sate      
  const [selectedFriendRoom, setSelectedFriendRoom] = useState(null); //친구 선택 채팅방
  const [friendMessages, setFriendMessages] = useState([]); // 친구 1:1 채팅 메시지

  // State 보관함 해체
  const { 
    isLogIn, setIsLogIn, userData, setUserData, setHasUnreadMessages, theme, toggleTheme, 
    voiceParticipants: globalVoiceParticipants, setVoiceParticipants: setGlobalVoiceParticipants,
    // 음성채팅 관련 state
    activeVoiceChannel, setActiveVoiceChannel,
    voiceChatRoomId, setVoiceChatRoomId,
    voiceSpeakers, setVoiceSpeakers,
    localMuted, setLocalMuted,
    joinedVoice, setJoinedVoice,
    currentVoiceRoomId, setCurrentVoiceRoomId,
    currentSelectedRoom, setCurrentSelectedRoom,
    voiceChatRef,
    listRefreshTick, setListRefreshTick,
    pendingCount
  } = useContext(LogContext)

  // 전역 STOMP 클라이언트 초기화
  const globalStomp = useGlobalStomp(userData);

  // 메시지 로딩 및 읽음 처리 훅
  const getChatList = useChatListGet();
  const setRead = useSetReadUnReadChat(userData);
  
  // 친구 요청 개수 조회 훅

  // // userData가 로드될 때까지 로딩
  // if (!userData) {
  //   return <div>userData 로딩중</div>; 
  // }

  // 현재 방의 참여자 목록 (전역 voiceParticipants에서 가져옴)
  const voiceParticipants = useMemo(() => {
    return selectedRoom?.id ? (globalVoiceParticipants[selectedRoom.id] || []) : [];
  }, [selectedRoom?.id, globalVoiceParticipants]);

  // selectedRoom이 변경될 때마다 Context의 currentSelectedRoom 업데이트
  useEffect(() => {
    setCurrentSelectedRoom(selectedRoom);
  }, [selectedRoom, setCurrentSelectedRoom]);

  // 채널 클릭 시
  const onJoinVoice = (roomId) => {
    setCurrentVoiceRoomId(roomId);
    setVoiceChatRoomId(roomId);
  };


  // 음성설정 모달
  const [showVoiceChatModal, setShowVoiceChatModal] = useState(false);
  const localAudioTrackRef = useRef(null);
  const { voiceSettings, setVoiceSettings } = useContext(LogContext);

  // 입장 신청 관리 상태 제거 - 기존 UI에 통합

  // 참여자 패널 상태
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(false);

  // 커스텀 훅 가져오기
  // --UseEffect
  useLoginCheck(isLogIn);                                         // 로그인 체크 훅
  useChatSubscriber(selectedRoom, setMessages, setClient, userData, globalStomp);    // 채팅방 구독 훅
  useFriendChatSubscriber(selectedFriendRoom, setFriendMessages, globalStomp, setClient);   // 친구 1:1 채팅방 구독 훅
  useFriendReadChat(selectedFriendRoom, userData, friendMessages); // 친구 채팅 읽음 처리 훅

  // -- Function
  const logoutFunc = useLogout();                                          // 로그아웃 훅
  const sendMessage = useChatSender(client, selectedRoom, userData, input, setInput);   // 메세지 전송 훅 
  const sendFriendMessage = useFriendChatSender(client ,selectedFriendRoom, userData, input, setInput);

  const location = useLocation();                                      // 방 입장 시 전달된 state 확인

  // useUserStatusReporter 훅에서 반환되는 새로운 함수를 받음
  const [userStatus, manuallySetStatus] = useUserStatusReporter(userData?.userId);

  // 상태 아이콘 매핑 함수 추가
  function getStatusIcon(status) {
    if (status === '온라인') return '🟢';
    if (status === '자리비움') return '🟠';
    return '🔴';
  }

  // 음성 설정 열기 함수
  async function openVoiceSettings() {
    try {
      if (!localAudioTrackRef.current) {
        const track = await AgoraRTC.createMicrophoneAudioTrack();
        localAudioTrackRef.current = track;
      }
      setShowVoiceChatModal(true);
    } catch (err) {
      console.error("agora 초기화 실패:", err);
    }
  }

  // 스크롤 하단 자동 이동 Effect
  const messageContainerRef = useRef(null);
  const previousMessageCountRef = useRef(0);
  const previousFriendMessageCountRef = useRef(0);
  
  //채팅방 설정 업데이트 핸들러
  const handleRoomUpdated = (updatedRoom) => {
    console.log('방 설정이 업데이트되었습니다:', updatedRoom);
    //selectedRoom 상태 업데이트
    setSelectedRoom(prev => prev ? { ...prev, ...updatedRoom } : null);
    //채팅방 목록도 새로고침
    setListRefreshTick(t => t + 1);
  };

  // 스크롤 위치 관리 - 새로운 메시지가 추가될 때만 맨 아래로 스크롤
  useEffect(() => {
    const container = messageContainerRef.current;
    if (!container) return;

    const currentMessageCount = messages.length;
    const currentFriendMessageCount = friendMessages.length;
    
    // 새로운 메시지가 추가된 경우에만 맨 아래로 스크롤
    const hasNewMessages = currentMessageCount > previousMessageCountRef.current;
    const hasNewFriendMessages = currentFriendMessageCount > previousFriendMessageCountRef.current;
    
    // 메시지 개수가 증가한 경우에만 스크롤 (고정/해제는 개수 변화 없음)
    if (hasNewMessages || hasNewFriendMessages) {
      console.log('새 메시지 감지 - 스크롤을 맨 아래로 이동');
      container.scrollTop = container.scrollHeight;
    } else if (currentMessageCount > 0 || currentFriendMessageCount > 0) {
      // 메시지 고정/해제 등의 경우 스크롤 위치 유지 (개수 변화 없음)
      console.log('메시지 상태 변경 감지 - 스크롤 위치 유지');
    }
    
    // 현재 메시지 개수 업데이트
    previousMessageCountRef.current = currentMessageCount;
    previousFriendMessageCountRef.current = currentFriendMessageCount;
  }, [messages, friendMessages]);

  //프로필 정보 DB에서 불러오기
  useEffect(() => {
    // userData.userId가 없으면 아무 작업도 하지 않음
    if (!userData?.userId) return;

    axios.get("/api/profile/user/info", { params: { userId: userData.userId } })
      .then(res => {
        setUserData(prevUserData => ({
          ...prevUserData, //기존 데이터를 모두 복사
          ...res.data,     //새로 받은 데이터로 덮어쓰기
          //authorities 만큼은 무조건 기존 값으로 다시 덮어쓰기
          authorities: prevUserData.authorities
        }));
      })
      .catch(err => console.error("유저 정보 불러오기 실패:", err));

  }, [userData?.userId, setUserData]);

  useEffect(() => {
    const s = location.state;

    if (!s) return;

    if (s.type === 'multi' && s.roomId) {
      setSelectedFriendRoom(null);
      setFriendMessages([]);
      setSelectedRoom(undefined);
      setMessages([]);
      setShowMidBar(true);

      (async () => {
        let roomData = null;
        try {
          const id = encodeURIComponent(s.roomId);
          const { data } = await axios.get(`/api/chat/rooms/${id}`);
          roomData = data;

        // 서버에서 상세 방 정보를 가져와 state 업데이트
        setSelectedRoom({
          id: data.id,
          name: data.name ?? s.chatName,
          gameName: data.gameName ?? s.gameName,
          tagNames: Array.isArray(data.tagNames) ? data.tagNames : (s.tagNames ?? []),
          currentUsers: (typeof data.currentUsers === 'number') ? data.currentUsers : s.currentUsers,
          maxUsers: (typeof data.maxUsers === 'number') ? data.maxUsers : s.maxUsers,
          hostUserId: data.hostUserId, // 방장 ID 추가
          joinType: data.joinType ?? s.joinType ?? 'approval', // 입장 방식 추가
        });
      } catch (e) {
        setSelectedRoom({
          id: s.roomId,
          name: s.chatName,
          gameName: s.gameName,
          tagNames: s.tagNames ?? [],
          currentUsers: s.currentUsers,
          maxUsers: s.maxUsers,
          hostUserId: s.hostUserId, // chatList에서 hostUserId 가져오기
          joinType: s.joinType ?? 'approval', // 입장 방식 추가
        });
      } finally {
        setListRefreshTick(t => t + 1);  // 방 리스트를 새로고침하도록 트리거

        // WebSocket 연결 확인 후 방장 입장 처리
        const processHostEntry = () => {
          // 서버에서 받은 방 정보의 joinType 사용
          const roomJoinType = roomData?.joinType ?? s.joinType ?? 'approval';
          
          // 승인된 사용자이거나 이미 가입된 사용자이거나 방장 승인 방인 경우 - join API 호출하지 않음
          // 임시로 승인된 사용자는 무조건 join API 호출하지 않음
          if (s.alreadyJoined || s.joinType === 'approval' || roomJoinType !== 'free' || s.type === 'multi') {
            getChatList(s.roomId, setMessages);
            setRead({ id: s.roomId });
            
            // sessionStorage에서 pendingJoinMessage 확인 후 추가
            const pendingMessage = sessionStorage.getItem('pendingJoinMessage');
            if (pendingMessage) {
              try {
                const joinMsg = JSON.parse(pendingMessage);
                setMessages(prev => [...prev, joinMsg]);
                sessionStorage.removeItem('pendingJoinMessage');
              } catch (e) {
                console.warn('pendingJoinMessage 파싱 실패:', e);
                sessionStorage.removeItem('pendingJoinMessage');
              }
            }
          } else {
            // 자유 입장 방인 경우에만 join API 호출
            axios.post(`/api/chat/rooms/${s.roomId}/join`, {
              userId: userData.userId
            }).then(() => {
              // 채팅방 이동 시 메시지 로딩 및 읽음 처리
              getChatList(s.roomId, setMessages);
              setRead({ id: s.roomId });
              
              // sessionStorage에서 pendingJoinMessage 확인 후 추가
              const pendingMessage = sessionStorage.getItem('pendingJoinMessage');
              if (pendingMessage) {
                try {
                  const joinMsg = JSON.parse(pendingMessage);
                  setMessages(prev => [...prev, joinMsg]);
                  sessionStorage.removeItem('pendingJoinMessage');
                } catch (e) {
                  console.warn('pendingJoinMessage 파싱 실패:', e);
                  sessionStorage.removeItem('pendingJoinMessage');
                }
              }
              
              // 자유 입장 성공 - WebSocket 이벤트로 멤버 목록이 자동 업데이트됨
            }).catch(err => {
              console.error('자유 입장 실패:', err);
              // 실패해도 메시지는 로딩
              getChatList(s.roomId, setMessages);
              setRead({ id: s.roomId });
            });
          }
        };

        // WebSocket 연결 확인 후 처리
        if (globalStomp && globalStomp.isConnected()) {
          processHostEntry();
        } else {
          // WebSocket 연결 대기
          const checkConnection = () => {
            if (globalStomp && globalStomp.isConnected()) {
              processHostEntry();
            } else {
              setTimeout(checkConnection, 100);
            }
          };
          checkConnection();
        }
      }
    })();
  }

  if (s.type === 'friend' && s.friendId) {
      setSelectedRoom(null);
      setMessages([]);
      setShowMidBar(true);

      (async () => {
        try {
          // 친구 채팅방 생성/조회
          const response = await axios.get(`/api/friends/chatroom/${s.friendId}/${userData.userId}`);
          const chatRoom = response.data;
          console.log('1:1 채팅방 정보:', chatRoom);
          // 친구 채팅방 상세 업데이트
          setSelectedFriendRoom({ roomId: chatRoom.roomId, friendId: s.friendId });
          await useFriendChatListGet(chatRoom.roomId, setFriendMessages);
          
          // 친구 채팅방 입장 시 읽음 처리 (useFriendReadChat 훅에서 자동 처리됨)
        } catch (err) {
          console.error('1:1 채팅 로드 실패:', err);
        }
      })();
    }
  }, [location.key]);

  // 방 설정 업데이트 이벤트 구독
  useEffect(() => {
    if (!globalStomp || !selectedRoom?.id) return;

    const subscriptionId = `room-updated-${selectedRoom.id}`;

    // 방 설정 업데이트 이벤트 구독
    globalStomp.subscribe(`/topic/chat/${selectedRoom.id}/room-updated`, (frame) => {
      try {
        const payload = JSON.parse(frame.body);
        console.log('방 설정 업데이트 알림 수신:', payload);
        
        // 방 정보 새로고침
        axios.get(`/api/chat/rooms/${selectedRoom.id}`)
          .then(res => {
            const roomData = res.data;
            setSelectedRoom(prev => prev ? {
              ...prev,
              name: roomData.name,
              gameName: roomData.gameName,
              tagNames: roomData.tagNames,
              maxUsers: roomData.maxUsers,
              joinType: roomData.joinType
            } : null);
          })
          .catch(err => console.error('방 정보 새로고침 실패:', err));
      } catch (e) {
        console.warn('방 설정 업데이트 알림 parse error', e);
      }
    }, { id: subscriptionId });

    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom?.id, globalStomp]);

  // VoiceChat에서 참여자 변경을 감지했을 때 호출되는 함수
  const handleVoiceParticipantsChange = useCallback((participants) => {
    // Agora 이벤트는 무시하고 WebSocket만 사용
  }, []);

  // 현재 방의 실시간 음성참가자 구독
  useEffect(() => {
    if (!selectedRoom?.id || !globalStomp) return;

    const roomId = selectedRoom.id;
    const subscriptionId = `voice-participants-${roomId}`;

    globalStomp.subscribe(`/topic/chat/${roomId}/voice-participants`, (frame) => {
      console.log("📡 ROOM RECEIVE:", frame.body);
      try {
        const data = JSON.parse(frame.body);
        // 서버는 List<VoiceParticipantDto>를 보내므로 data는 배열 형태
        setGlobalVoiceParticipants(prev => ({
          ...prev,
          [roomId]: data
        }));
      } catch (e) {
        console.error("음성채널 방별 업데이트 에러:", e);
      }
    }, { id: subscriptionId });

    // cleanup (방 이동 시 기존 구독 해제)
    return () => {
      globalStomp.unsubscribe(subscriptionId);
    };
  }, [selectedRoom?.id, globalStomp]);

  // 음성채팅 참가자 목록을 불러오기 (초기 로딩만)
  useEffect(() => {
    if (!selectedRoom?.id) return;

    // 초기 참가자 목록 로딩
    const fetchParticipants = async () => {
      try {
        const response = await axios.get(`/api/voice/participants/${selectedRoom.id}`);
        setGlobalVoiceParticipants(prev => ({
          ...prev,
          [selectedRoom.id]: response.data
        }));
      } catch (error) {
        console.error("음성채팅 참가자 목록 로딩 실패:", error);
      }
    };

    fetchParticipants();
  }, [selectedRoom?.id, setGlobalVoiceParticipants]);

  // userData가 로드될 때까지 로딩
  if (!userData) {
    return <div>userData 로딩중</div>;
  }


  return (
    <>
      <div className='fullscreen'>
        {/* 좌측 친구/채팅 바 */}
        {showMidBar &&
          <div className='leftBarSize'>
            <div className="toggle-container">
              <div onClick={() => { handleToggleChange(true); }}
                className={`toggleSwitchText toggleSwitch ${toggle ? 'activeBorder' : ''}`} >
                채팅
              </div>

              <div onClick={() => handleToggleChange(false)}
                className={`toggleSwitchText toggleSwitch ${!toggle ? 'activeBorder' : ''}`}>
                친구
                {pendingCount > 0 && (
                  <span className="friend-request-badge">
                    {pendingCount}
                  </span>
                )}
              </div>
            </div>

            <div className='listSize'>
              {toggle ?
                <ChatListPage
                  setMessages={setMessages}
                  selectedRoom={selectedRoom}
                  setSelectedRoom={setSelectedRoom}
                  onOpenProfile={(targetUserId) => { setProfileUserId(targetUserId); setShowProfileModal(true); }}
                  currentUserStatus={userStatus}
                  onJoinVoice={onJoinVoice}
                  globalStomp={globalStomp}
                  refreshTick={listRefreshTick}

                  // VoiceChat 관련 props
                  userData={userData}
                  voiceSpeakers={voiceSpeakers}
                  voiceParticipants={voiceParticipants}
                  setVoiceParticipants={setGlobalVoiceParticipants}
                  voiceChatRef={voiceChatRef}
                  setVoiceChatRoomId={setVoiceChatRoomId}
                  onLeaveVoice={() => {
                    if (voiceChatRef.current) {
                      voiceChatRef.current.leaveChannel();
                    }
                  }}
                  onToggleMute={() => {
                    if (voiceChatRef.current) {
                      voiceChatRef.current.toggleMute();
                    }
                  }}
                  localMuted={localMuted}
                  setLocalMuted={setLocalMuted}
                  joinedVoice={joinedVoice}
                  setJoinedVoice={setJoinedVoice}
                  voiceChatRoomId={voiceChatRoomId}
                  setActiveVoiceChannel={setActiveVoiceChannel}
                  uid={userData.userId}
                  onParticipantsChange={handleVoiceParticipantsChange}

                  // UserHistoryModal 관련 props
                  isUserHistoryOpen={isUserHistoryOpen}
                  setIsUserHistoryOpen={setIsUserHistoryOpen}
                  historyUserId={historyUserId}
                  setHistoryUserId={setHistoryUserId}
                  sendToModalGameName={sendToModalGameName}
                  setSendToModalGameName={setSendToModalGameName}
                  
                  onMembersPanelToggle={setIsMembersPanelOpen}
                  setHasUnreadMessages={setHasUnreadMessages}
                />
                : <FriendListPage
                  userId={userData.userId}
                />}
            </div>

            {/* 하단 버튼 영역 */}
            <div className="bottom-buttons-container">
              {/* 로고 이미지 */}
              <img 
                src="/qLogo.png" 
                alt="QMatch 로고" 
                className="qlogo-image"
              />
              {userData?.authorities?.some(auth => auth.authority === 'ROLE_ADMIN') && (
                <Link to="/admin">
                  <button className="bottom-button" aria-label="관리자 페이지">
                    <MdOutlineConstruction className="button-icon" />
                  </button>
                </Link>
              )}
              {/* 프로필 이미지 버튼 */}
              <div className="profile-button-wrapper">
                <img
                  src={userData?.userProfile ? import.meta.env?.VITE_API_URL + `${userData.userProfile}` : "https://placehold.co/250x250"}
                  onClick={() => { setProfileUserId(userData?.userId); setShowProfileModal(true); }}
                  className="profile-button"
                  alt="프로필"
                />
                {/* 상태 표시 - 프로필 이미지 우상단 */}
                <div
                  className="status-indicator-wrapper"
                  onMouseEnter={() => setIsStatusPanelOpen(true)}
                  onMouseLeave={(e) => {
                    if (!e.currentTarget.contains(e.relatedTarget)) {
                      setIsStatusPanelOpen(false);
                    }
                  }}
                >
                  <div className="status-indicator">
                    <span>{getStatusIcon(userStatus)}</span>
                  </div>

                  {isStatusPanelOpen && (
                    <div
                      className="status-side-panel"
                      onMouseEnter={() => setIsStatusPanelOpen(true)}
                      onMouseLeave={(e) => {
                        if (!e.currentTarget.contains(e.relatedTarget)) {
                          setIsStatusPanelOpen(false);
                        }
                      }}
                    >
                      <div className="status-item" onClick={() => manuallySetStatus('온라인')}>🟢 온라인</div>
                      <div className="status-item" onClick={() => manuallySetStatus('자리비움')}>🟠 자리 비움</div>
                      <div className="status-item" onClick={() => manuallySetStatus('오프라인')}>🔴 오프라인</div>
                    </div>
                  )}
                </div>
              </div>

              {/* 테마 전환 버튼 */}
              <div className="theme-toggle-wrapper">
                <button
                  onClick={toggleTheme}
                  className="theme-toggle-button"
                  title={`현재 테마: ${theme === 'dark' ? '다크' : theme === 'light' ? '라이트' : theme === 'pink' ? '핑크' : '블루'}`}
                >
                  {theme === 'dark' && '🌙'}
                  {theme === 'light' && '☀️'}
                  {theme === 'pink' && '💖'}
                  {theme === 'blue' && '💙'}
                </button>
              </div>

              {/* 음성 설정 버튼 */}
              <button
                className="bottom-button"
                aria-label="음성 채팅 설정"
                onClick={openVoiceSettings}
              >
                <FaPhone className="button-icon" />
              </button>

            </div>
          </div>
        }


        {/*우측 채팅방 */}
        <div className={`rightBarSize ${isMembersPanelOpen ? "with-members-panel" : ""}`}>

        <ChatRoom
          userData={userData}
          selectedRoom={selectedRoom}
          selectedFriendRoom={selectedFriendRoom}
          messages={messages}
          friendMessages={friendMessages}
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          messageContainerRef={messageContainerRef}
          onRoomUpdated={handleRoomUpdated}
          sendFriendMessage={sendFriendMessage}
          client={client}
          setFriendMessages={setFriendMessages}
        />

          <div style={{ display: "flex" }}>
            <div className='adSize'>
              <span style={{ color: 'var(--discord-text-muted)', fontSize: '14px' }}>
                QMatch - 게임 팀원 모집 플랫폼
              </span>
              <img src="./yongbinHikingClub.png" alt="" style={{ position: 'flex', width: '220px', height: '75px' }} />
            </div>
            <Link to="/search">
              <div className='searchSize'>
                <IoSearch className='search-icon-react' />
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/*프로필 모달 */}
      {showProfileModal &&
        <MyProfile viewUserId={profileUserId} // 클릭한 유저 아이디
          isMyProfile={profileUserId === userData.userId} //내 프로필 여부 확인
          userData={userData} //내 프로필일 때만 사용
          setUserData={setUserData}
          onClose={() => setShowProfileModal(false)}
        />}

      {/* 음성 설정 모달 */}
      {showVoiceChatModal && (
        <VoiceChatModal
          onClose={() => setShowVoiceChatModal(false)}
          localAudioTrack={localAudioTrackRef.current}
          voiceSettings={voiceSettings}
          onChangeSettings={setVoiceSettings}
        />
      )}


      {/* 입장 신청 관리 모달 제거 - 기존 UI에 통합 */}

      {/* 사용자 전적 모달 */}
      {isUserHistoryOpen && (
        <UserHistoryModal
          sendToModalGameName={sendToModalGameName}
          setUserHistoryOpen={setIsUserHistoryOpen}
          historyUserId={historyUserId}
        />
      )}
    </>
  )
}

export default LobbyPage

